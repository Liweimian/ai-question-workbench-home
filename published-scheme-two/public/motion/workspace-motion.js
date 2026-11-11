/* Motion adapter for the exact published runtime. React owns all application state. */
(() => {
  'use strict';
  const duration = 480;
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = null;
  let active = null;

  function home() {
    return !!document.querySelector('.add-workspace-home.is-active');
  }

  function paper() {
    return document.querySelector('.document-center-draft .editor-paper-sheet') ||
      document.querySelector('.workspace-shell > .editor-scroll .editor-paper-sheet') ||
      document.querySelector('.workspace-shell > .editor-scroll .editor-document, .workspace-shell > .editor-scroll .editor-empty');
  }

  function scrollHost(element) {
    if (element.scrollHeight > element.clientHeight + 1) return element;
    return element.closest('.editor-scroll') || element;
  }

  // A bitmap-like DOM snapshot retains the old paper's styles even after its
  // original ancestors unmount. It never participates in layout or React state.
  function snapshot(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const copy = element.cloneNode(true);
    const sources = [element, ...element.querySelectorAll('*')];
    const copies = [copy, ...copy.querySelectorAll('*')];
    const scrolls = [];
    sources.forEach((source, index) => {
      const target = copies[index];
      const computed = getComputedStyle(source);
      target.removeAttribute('id');
      target.removeAttribute('autofocus');
      target.removeAttribute('name');
      for (const property of computed) {
        target.style.setProperty(property, computed.getPropertyValue(property));
      }
      target.style.setProperty('animation', 'none');
      target.style.setProperty('transition', 'none');
      target.style.setProperty('caret-color', 'transparent');
      if ('value' in source && 'value' in target) target.value = source.value;
      if ('checked' in source && 'checked' in target) target.checked = source.checked;
      if (source.scrollTop || source.scrollLeft) scrolls.push([target, source.scrollLeft, source.scrollTop]);
    });
    const overlay = document.createElement('div');
    overlay.className = 'workspace-motion-snapshot';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    Object.assign(overlay.style, {
      left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`,
      background: getComputedStyle(element).backgroundColor,
    });
    // offsetWidth is in the original CSS coordinate system; rect includes any
    // ancestor zoom. Keep that scale instead of expanding text in the snapshot.
    Object.assign(copy.style, {
      position: 'absolute', left: '0', top: '0', right: 'auto', bottom: 'auto',
      margin: '0', boxSizing: 'border-box',
      width: `${element.offsetWidth || rect.width}px`, height: `${element.offsetHeight || rect.height}px`,
      minWidth: '0', maxWidth: 'none', minHeight: '0', maxHeight: 'none',
      transformOrigin: '0 0',
      transform: `scale(${rect.width / (element.offsetWidth || rect.width)})`,
    });
    overlay.append(copy);
    return { overlay, rect, mount() {
      document.body.append(overlay);
      scrolls.forEach(([node, left, top]) => { node.scrollLeft = left; node.scrollTop = top; });
    } };
  }

  // Identity comes from the exact runtime's accessible labels / tracking keys,
  // not DOM order: district and school deliberately share the same silhouette.
  function taskKey(button) {
    const track = button.getAttribute('data-track') || '';
    if (track.includes('/openAiSearch')) return 'search';
    if (track.includes('/openMyResources')) return 'my';
    if (track.includes('/openRecentBrowse')) return 'recent';
    const label = (button.getAttribute('aria-label') || button.textContent || '').replace(/\s+/g, '');
    const identities = [
      ['chapter', '章节/知识点'], ['sync', '同步练习'], ['workbook', '练习册'],
      ['special', '专题练习'], ['paper', '试卷'], ['district', '区本'],
      ['school', '校本'], ['upload', '录题'], ['create', 'AI出题'],
      ['compose', 'AI组题'], ['search', 'AI智搜'], ['my', '我的资源'], ['recent', '最近浏览'],
    ];
    return identities.find(([, text]) => label.includes(text))?.[0] || null;
  }

  function navigationIcons(container, capture = false) {
    if (!container) return [];
    // The rail also contains an opacity:0 expanded hover menu. Its buttons
    // have nonzero bounds, so scope explicitly to the visible compact nav.
    const selector = container.matches('.source-navigation-rail')
      ? '.source-navigation-icon-nav button' : '.document-center-nav button';
    return [...container.querySelectorAll(selector)].flatMap(button => {
      const key = taskKey(button);
      const svg = button.querySelector('.source-navigation-short-icon > svg, svg');
      if (!key || !svg) return [];
      const bounds = svg.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return [];
      const style = getComputedStyle(svg);
      const zoom = bounds.width / (parseFloat(style.width) || bounds.width);
      const left = parseFloat(style.paddingLeft) * zoom || 0;
      const right = parseFloat(style.paddingRight) * zoom || 0;
      const top = parseFloat(style.paddingTop) * zoom || 0;
      const bottom = parseFloat(style.paddingBottom) * zoom || 0;
      const rect = { left: bounds.left + left, top: bounds.top + top,
        width: bounds.width - left - right, height: bounds.height - top - bottom };
      if (!capture) return [{ key, rect }];
      const image = snapshot(svg);
      if (!image) return [];
      // Home SVGs have a padded 28px color tile; fly the actual 18px drawing,
      // matching the compact rail's unpadded 16px SVG without shrinking twice.
      image.rect = rect;
      Object.assign(image.overlay.style, { left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, background: 'transparent', overflow: 'visible' });
      Object.assign(image.overlay.firstElementChild.style, { width: `${rect.width}px`, height: `${rect.height}px`,
        padding: '0', border: '0', background: 'transparent', boxShadow: 'none', transform: 'none' });
      image.overlay.classList.add('workspace-motion-icon');
      return [{ key, rect, image }];
    });
  }

  function cancel() {
    if (pending) {
      pending.observer.disconnect();
      clearTimeout(pending.timeout);
      pending = null;
    }
    if (active) active.cleanup();
  }

  function run(before) {
    const destination = paper();
    if (!destination || !before.paper) return;
    const host = scrollHost(destination);
    host.scrollTop = before.scrollTop;
    host.scrollLeft = before.scrollLeft;
    const target = destination.getBoundingClientRect();
    if (!target.width || !target.height) return;
    const animations = [];
    const overlays = [];
    const originalOpacity = new Map();
    const session = { cleanup() {
      animations.forEach(animation => animation.cancel());
      overlays.forEach(overlay => overlay.remove());
      originalOpacity.forEach((opacity, element) => {
        if (opacity) element.style.setProperty('opacity', opacity.value, opacity.priority);
        else element.style.removeProperty('opacity');
      });
      document.documentElement.classList.remove('workspace-motion-running');
      if (active === session) active = null;
    } };
    active = session;
    document.documentElement.classList.add('workspace-motion-running');

    function reveal(element, delay = 180, end = 450) {
      if (!element) return;
      const value = element.style.getPropertyValue('opacity');
      originalOpacity.set(element, value ? { value, priority: element.style.getPropertyPriority('opacity') } : null);
      element.style.setProperty('opacity', '0');
      animations.push(element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: end - delay, delay, easing: 'ease-out', fill: 'both',
      }));
    }

    try {
      const shared = before.paper;
      shared.mount();
      overlays.push(shared.overlay);
      const flight = document.createElement('div');
      flight.className = 'workspace-motion-paper-flight';
      flight.setAttribute('aria-hidden', 'true');
      flight.inert = true;
      Object.assign(flight.style, { left: `${shared.rect.left}px`, top: `${shared.rect.top}px`,
        width: `${shared.rect.width}px`, height: `${shared.rect.height}px` });
      const lift = document.createElement('div');
      lift.className = 'workspace-motion-paper-lift';
      flight.append(lift);
      document.body.append(flight);
      lift.append(shared.overlay);
      Object.assign(shared.overlay.style, { position: 'absolute', left: '0', top: '0' });
      overlays.push(flight);
      reveal(destination, 380, 480);
      const scale = target.width / shared.rect.width;
      const restingShadow = getComputedStyle(destination).boxShadow;
      // One transform owns travel + uniform scale; the inner frame owns lift.
      // This keeps all glyphs proportional and lets the height clip reflow.
      animations.push(flight.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${target.left - shared.rect.left}px, ${target.top - shared.rect.top}px) scale(${scale})` },
      ], { duration, easing, fill: 'both' }));
      animations.push(shared.overlay.animate([
        { height: `${shared.rect.height}px` }, { height: `${target.height / scale}px` },
      ], { duration, easing, fill: 'both' }));
      animations.push(lift.animate([
        { transform: 'translateY(0)', boxShadow: before.paperShadow, offset: 0, easing: 'ease-in-out' },
        { transform: 'translateY(-9px)', boxShadow: '0 18px 38px rgba(31, 42, 69, 0.19)', offset: 0.24, easing: 'ease-in-out' },
        { transform: 'translateY(-6px)', boxShadow: '0 13px 29px rgba(31, 42, 69, 0.13)', offset: 0.66, easing: 'ease-in-out' },
        { transform: 'translateY(0)', boxShadow: restingShadow, offset: 1 },
      ], { duration, easing: 'linear', fill: 'both' }));
      // The lifted shadow is on an unclipped frame; paper content remains clipped.
      animations.push(lift.animate([
        { height: `${shared.rect.height}px` }, { height: `${target.height / scale}px` },
      ], { duration, easing, fill: 'both' }));
      animations.push(flight.animate([{ opacity: 1 }, { opacity: 0 }], {
        delay: 380, duration: 100, easing: 'ease-in', fill: 'both',
      }));

      const navigation = document.querySelector(home() ? '.document-center-sidebar' : '.source-navigation-rail');
      if (before.navigation && navigation) {
        const old = before.navigation;
        const next = navigation.getBoundingClientRect();
        const targetIcons = new Map(navigationIcons(navigation).map(icon => [icon.key, icon]));
        // Remove the stationary old drawings before mounting the menu snapshot.
        // Only the independently flying silhouettes remain visible.
        old.overlay.querySelectorAll('svg').forEach(svg => {
          // Retain the pale padded SVG tile on the old background; only the
          // drawing leaves immediately with its flying silhouette.
          [...svg.children].forEach(shape => { shape.style.visibility = 'hidden'; });
          animations.push(svg.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 160, easing: 'ease-in-out', fill: 'both',
          }));
        });
        old.mount();
        overlays.push(old.overlay);
        animations.push(old.overlay.animate([
          { width: `${old.rect.width}px`, height: `${old.rect.height}px`, transform: 'translate(0, 0)' },
          { width: `${next.width}px`, height: `${next.height}px`, transform: `translate(${next.left - old.rect.left}px, ${next.top - old.rect.top}px)` },
        ], { duration, easing, fill: 'both' }));
        old.overlay.querySelectorAll('button span, .document-center-nav-title').forEach(label => {
          if (!label.matches('.source-navigation-short-icon')) animations.push(label.animate([
            { opacity: 1 }, { opacity: 0 },
          ], { duration: 100, easing: 'ease-out', fill: 'both' }));
        });
        animations.push(old.overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
          delay: 160, duration: 220, easing: 'ease-in', fill: 'both',
        }));
        reveal(navigation, 380, 480);
        before.icons.forEach((icon, index) => {
          const image = icon.image;
          image.mount();
          overlays.push(image.overlay);
          const targetIcon = targetIcons.get(icon.key);
          if (!targetIcon) {
            animations.push(image.overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 120, fill: 'both',
            }));
            return;
          }
          const end = targetIcon.rect;
          const delay = Math.min(index * 2.5, 30);
          animations.push(image.overlay.animate([
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${end.left - icon.rect.left}px, ${end.top - icon.rect.top}px) scale(${end.width / icon.rect.width})` },
          ], { duration: duration - delay, delay, easing, fill: 'both' }));
          animations.push(image.overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
            delay: 380, duration: 100, easing: 'ease-in', fill: 'both',
          }));
        });
      }
      // The result pane appears after the paper and navigation have started moving.
      if (!home()) {
        const workspace = document.querySelector('.add-workspace');
        if (workspace) [...workspace.children].forEach(child => {
          if (!child.matches('.add-workspace-topbar, .source-navigation-rail')) reveal(child);
        });
      }
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (active === session) session.cleanup();
      });
    } catch (_) {
      session.cleanup(); // Unsupported WAAPI must leave the live editor visible.
    }
  }

  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button || !button.closest('.workbench-page')) return;
    cancel();
    if (reducedMotion.matches || typeof Element.prototype.animate !== 'function') return;
    const wasHome = home();
    // Home can enter a workspace through navigation, an already-open task tab,
    // or the paper's add controls. Observe all home buttons, then animate only
    // when React actually changes mode. No-op/format/save clicks stay untouched.
    const isNavigation = wasHome ||
      button.matches('.add-workspace-home') || button.closest('.add-workspace-tab-close');
    if (!isNavigation || button.disabled) return;
    const originalPaper = paper();
    if (!originalPaper) return;
    const host = scrollHost(originalPaper);
    const before = {
      paper: snapshot(originalPaper),
      paperShadow: getComputedStyle(originalPaper).boxShadow,
      icons: navigationIcons(document.querySelector(wasHome ? '.document-center-sidebar' : '.source-navigation-rail'), true),
      navigation: snapshot(document.querySelector(wasHome ? '.document-center-sidebar' : '.source-navigation-rail')),
      scrollTop: host.scrollTop, scrollLeft: host.scrollLeft,
    };
    const observer = new MutationObserver(() => {
      if (home() === wasHome) return;
      observer.disconnect();
      clearTimeout(pending?.timeout);
      pending = null;
      run(before);
    });
    observer.observe(document.getElementById('root'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    // Unrelated/no-op navigation has no lasting observer or snapshot in the DOM.
    pending = { observer, timeout: setTimeout(() => {
      observer.disconnect();
      if (pending?.observer === observer) pending = null;
    }, 500) };
  }, true);

  window.addEventListener('resize', cancel);
  window.addEventListener('pagehide', cancel);
  reducedMotion.addEventListener?.('change', cancel);
})();
