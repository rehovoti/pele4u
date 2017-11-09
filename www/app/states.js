angular.module('pele.states', [])
  .constant('appStates', [{
    state: "app.dev",
    url: '/dev',
    views: {
      'menuContent@app': {
        templateUrl: function() {
          return 'app/apps/dev/devmenu.html';
        },
        controller: 'AppCtrl',
      }
    }
  }, {
    state: "app.dev.log",
    url: '/log',
    views: {
      'menuContent@app': {
        templateUrl: function() {
          return 'app/apps/dev/log.html';
        },
        controller: 'devCtrl',
      }
    },
    src: ["app/apps/dev/devCtrl.js"]
  }, {
    state: "app.dev.errors",
    url: '/errors',
    views: {
      'menuContent@app': {
        templateUrl: function() {
          return 'app/apps/dev/errors.html';
        },
        controller: 'devCtrl',
      }
    },
    src: ["app/apps/dev/devCtrl.js"]
  }, {
    state: "app.dev.attach",
    url: '/attach',
    views: {
      'menuContent@app': {
        templateUrl: function() {
          return 'app/apps/dev/attach.html';
        },
        controller: 'devCtrl',
      }
    },
    src: ["app/apps/dev/devCtrl.js"]
  }, {
    state: "app.p2_moduleList",
    url: '/p2_moduleList/:AppId/:Title/:Pin',
    views: {
      'menuContent': {
        templateUrl: function() {
          return 'app/apps/docApprove/p2_moduleList.html';
        },
        controller: 'P2_moduleListCtrl',
      }
    },
    src: ["app/apps/docApprove/P2_moduleListCtrl.js"]
  }, {
    state: 'app.p3_rq_moduleDocList',
    url: "/p3_rq_moduleDocList/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/RQ/p3_rq_moduleDocList.html";
        },
        controller: 'p3_rq_moduleDocListCtrl'
      }
    },
    src: ["app/apps/docApprove/RQ/p3_rq_moduleDocListCtrl.js"]
  }, {
    state: 'app.p3_po_moduleDocList',
    url: "/p3_po_moduleDocList/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/PO/p3_po_moduleDocList.html";
        },
        controller: 'p3_po_moduleDocListCtrl'
      }
    },
    src: ["app/apps/docApprove/PO/p3_po_moduleDocListCtrl.js"]
  }, {
    state: 'app.p3_hr_moduleDocList',
    url: "/p3_hr_moduleDocList/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/HR/p3_moduleDocList.html";
        },
        controller: 'p3_hr_moduleDocListCtrl'
      }
    },
    src: ["app/apps/docApprove/HR/p3_hr_moduleDocListCtrl.js"]
  }, {
    state: 'app.tsk_list',
    url: "/task_list/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/TSK/tskList.html";
        },
        controller: 'tskListCtrl',
        controllerAs: "vm",
      }
    },
    src: ["app/apps/docApprove/TSK/tskListCtrl.js"]
  }, {
    state: 'app.tsk_details',
    url: "/task_details/:formType/:AppId/:docId/:docInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/TSK/tskDetails.html";
        },
        controller: 'tskDetailsCtrl'
      }
    },
    src: ["app/apps/docApprove/TSK/tskDetailsCtrl.js"]
  }, {
    state: 'app.inv_list',
    url: "/inv_list/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/INV/invList.html";
        },
        controller: 'invListCtrl',
        controllerAs: "vm",
      }
    },
    src: ["app/apps/docApprove/INV/invListCtrl.js"]
  }, {
    state: 'app.inv_details',
    url: "/inv_details/:formType/:AppId/:docId/:docInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/INV/invDetails.html";
        },
        controller: 'invDetailsCtrl'
      }
    },
    src: ["app/apps/docApprove/INV/invDetailsCtrl.js"]
  }, {
    state: 'app.ini_list',
    url: "/ini_list/:AppId/:FormType/:Pin",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/INI/iniList.html";
        },
        controller: 'iniListCtrl'
      }
    },
    src: ["app/apps/docApprove/INI/iniListCtrl.js"]
  }, {
    state: 'app.ini_details',
    url: "/ini_details/:formType/:AppId/:docId/:docInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/INI/iniDetails.html";
        },
        controller: 'iniDetailsCtrl'
      }
    },
    src: ["app/apps/docApprove/INI/iniDetailsCtrl.js"]
  }, {
    state: 'app.doc_10002',
    url: "/doc_10002/:AppId/:DocId/:DocInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/PO/p4_po_doc_10002.html";
        },
        controller: 'p4_po_doc_10002Ctrl'
      }
    },
    src: ["app/apps/docApprove/PO/p4_po_doc_10002Ctrl.js"]
  }, {
    state: 'app.doc_242',
    url: "/doc_242/:AppId/:DocId/:DocInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/HR/p4_doc_242.html";
        },
        controller: 'p4_hr_docCtrl'
      }
    },
    src: ["app/apps/docApprove/HR/p4_hr_docCtrl.js"]
  }, {
    state: 'app.doc_806',
    url: "/doc_806/:AppId/:DocId/:DocInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/HR/p4_doc_806.html";
        },
        controller: 'p4_hr_docCtrl'
      }
    },
    src: ["app/apps/docApprove/HR/p4_hr_docCtrl.js"]
  }, {
    state: 'app.doc_807',
    url: "/doc_807/:AppId/:DocId/:DocInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/HR/p4_doc_807.html";
        },
        controller: 'p4_hr_docCtrl'
      }
    },
    src: ["app/apps/docApprove/HR/p4_hr_docCtrl.js"]
  }, {
    state: 'app.doc_20002',
    url: "/doc_20002/:AppId/:DocId/:DocInitId",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/RQ/p4_rq_doc_20002.html";
        },
        controller: 'p4_rq_doc_20002Ctrl'
      }
    },
    src: ["app/apps/docApprove/RQ/p4_rq_doc_20002Ctrl.js"]

  }, {
    state: 'app.doc_30002',
    url: "/doc_30002/:AppId/:IniDocId/:IniDocInitId/:DocId/:Mode",
    views: {
      'menuContent': {
        templateUrl: function() {
          return "app/apps/docApprove/INI/p4_ini_doc_30002.html";
        },
        controller: 'p4_ini_doc_30002Ctrl'
      }
    },
    src: ["app/apps/docApprove/INI/p4_ini_doc_30002Ctrl.js"]
  }, {
    state: 'app.p2_scan_print',
    url: '/scan_print',
    views: {
      'menuContent': {
        templateUrl: function() {
          return 'app/apps/scanPrint/p2_scan_print.html';
        },
        controller: 'p2_scan_printCtrl'
      }
    },
    src: ["app/apps/scanPrint/p2_scan_printCtrl.js"]
  }]);
