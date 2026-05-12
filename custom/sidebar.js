(function(){
  'use strict';
  var STORAGE_KEY = 'algobeat_sidebar_collapsed';
  var BREAKPOINT = 768;

  function isMobile() { return false; }  // [v1.6.0] 取消移动端适配

  function applyCollapseState() {
    if (isMobile()) {
      document.documentElement.removeAttribute('data-ab-sidebar-collapsed');
      return;
    }
    var collapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    document.body.classList.toggle('algobeat-sidebar-collapsed', collapsed);
    if (collapsed) {
      document.documentElement.setAttribute('data-ab-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-ab-sidebar-collapsed');
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      document.body.classList.toggle('algobeat-sidebar-mobile-open');
    } else {
      var nowCollapsed = !document.body.classList.contains('algobeat-sidebar-collapsed');
      document.body.classList.toggle('algobeat-sidebar-collapsed', nowCollapsed);
      if (nowCollapsed) {
        document.documentElement.setAttribute('data-ab-sidebar-collapsed', 'true');
      } else {
        document.documentElement.removeAttribute('data-ab-sidebar-collapsed');
      }
      try { localStorage.setItem(STORAGE_KEY, nowCollapsed ? 'true' : 'false'); } catch (e) {}
    }
  }

  function closeMobileSidebar() {
    document.body.classList.remove('algobeat-sidebar-mobile-open');
  }

  function init() {
    applyCollapseState();
    var toggleBtn = document.querySelector('.ab-topbar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(e){ e.preventDefault(); toggleSidebar(); });
    }
    var backdrop = document.querySelector('.ab-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);
    // 手机端点导航项后自动关
    var items = document.querySelectorAll('.ab-sidebar-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function(){
        if (isMobile()) setTimeout(closeMobileSidebar, 100);
      });
    }
    // resize 处理
    var lastMobile = isMobile();
    window.addEventListener('resize', function(){
      var nowMobile = isMobile();
      if (nowMobile !== lastMobile) {
        lastMobile = nowMobile;
        if (nowMobile) {
          document.body.classList.remove('algobeat-sidebar-collapsed');
        } else {
          document.body.classList.remove('algobeat-sidebar-mobile-open');
          applyCollapseState();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
