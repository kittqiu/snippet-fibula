/*
 * jQuery treegrid Plugin 0.3.0
 * https://github.com/maxazan/jquery-treegrid
 *
 * Copyright 2013, Pomazan Max
 * Licensed under the MIT licenses.
 */
(function($) {
	var Utils = {};
	Utils.str2json = function(str, notevil) {
		try {
			if (notevil) {
				return JSON.parse(str
					// wrap keys without quote with valid double quote
					.replace(/([\$\w]+)\s*:/g, function(_, $1){return '"'+$1+'":';})
					// replacing single quote wrapped ones to double quote
					.replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"';})
				);
			} else {
				return (new Function("", "var json = " + str + "; return JSON.parse(JSON.stringify(json));"))();
			}
		} catch(e) { return false; }
	};

	Utils.options = function(string) {
			if ($.isPlainObject(string)) return string;
			var start = (string ? string.indexOf("{") : -1), options = {};
			if (start != -1) {
				try {
					options = Utils.str2json(string.substr(start));
				} catch (e) {}
			}

			return options;
		};

	var methods = {
		/**
		 * Initialize tree
		 *
		 * @param {Object} options
		 * @returns {Object[]}
		 */
		initTree: function(options) {
			var settings = $.extend({}, this.treegrid.defaults, options);
			return this.each(function() {
				var $this = $(this);
				$this.treegrid('setTreeContainer', $(this));
				$this.treegrid('setSettings', settings);
				settings.getRootNodes.apply(this, [$(this)]).treegrid('initNode', settings);
				$this.treegrid('getRootNodes').treegrid('render');
			});
		},
		/**
		 * Initialize tree which is in order. Add by qiuzy.
		 * @param {object} options
		 * @returns {Object[]}
		 */
		initTreeInOrder: function( options ){
			var settings = $.extend({}, this.treegrid.defaults, options);
			return this.each(function() {
				var $this = $(this),
					nodes = $this.find('tr'),
					i, j, pids = [], npid, id, level=0, pnc=[];
				var tplId = /treegrid-([A-Za-z0-9_-]+)/,
					tplPid = /treegrid-parent-([A-Za-z0-9_-]+)/;

				$this.data('treegrid',$this);
				$this.data('settings', settings);				
				//var starttime= new Date().getTime();
				for( i = 0; i < nodes.length; i++ ){
					/*得到节点ID和父结点ID*/
					var $n = $(nodes[i]);
					if( $n.attr('id') === undefined)continue;/*跳过表头*/
					
					var collapsed = $n.hasClass('treegrid-collapsed');
					id = tplId.exec($n.attr('class'))[1];
					if( $n.attr('class').indexOf('treegrid-parent-')!==-1){
						npid = tplPid.exec($n.attr('class'))[1];
						var index = pids.indexOf(npid);
						if( index === -1){/*新一层*/
							pids.push(npid);
						}else{/*收缩到前几层*/
							if( index !== pids.length - 1 ){
								pids.splice( index+1, pids.length -1 - index );
								pnc.splice( index+2, pids.length - 1 - index );
							}
						}
					}else{//else root node
						pids = [];
						pnc = [];						
						npid = 'root';
					}
					pnc.push( collapsed );
					level = pids.length;

					/*init*/
					$n.data('treegrid',$this);					

					$n.treegrid('initExpanderAcc', settings).treegrid('initIndentAcc', settings,level);
					$n.treegrid('initDragAcc', settings).treegrid('initEventsAcc', settings);
					$n.trigger("collapse");
					$n.treegrid('initChangeEvent').treegrid("initSettingsEvents");
					//$n.treegrid('initExpander').treegrid('initIndent', level).treegrid('initDrag').treegrid('initEvents').treegrid('initState').treegrid('initChangeEvent').treegrid("initSettingsEvents");
					
					/*render*/
					/*
					for( j = 0; j < pnc.length-1; j++ ){
						if( pnc[j]){
							$n.hide();
							break;
						}else if( j == pnc.length-2 && !pnc[j]){
							$n.show();
						}
					}*/
					if( npid == 'root' ){
						$n.show();
					}else{
						$n.hide();
					}
					if ( i != nodes.length - 1) {
						var nextNode = nodes[i+1];
						if( $(nextNode).attr('class').indexOf('treegrid-parent-'+id) !== -1 ){
							var expander = $n.find('.treegrid-expander');
							if (expander) {
								//if (!$n.hasClass('treegrid-collapsed')) {
								//	expander.removeClass(settings.expanderCollapsedClass);
								//	expander.addClass(settings.expanderExpandedClass);
								//} else {
									expander.removeClass(settings.expanderExpandedClass);
									expander.addClass(settings.expanderCollapsedClass);
								//}                     
							}
						}
					}
				}
				
				//if( i > 400 ){
						//console.log(new Date().getTime()-starttime)
				//		break;
				//	}
			});
		},
		renderAcc: function( $n, settings ){

		},


		/**
		 * Initialize node
		 *
		 * @param {Object} settings
		 * @returns {Object[]}
		 */
		initNode: function(settings) {
			return this.each(function() {
				var $this = $(this);
				$this.treegrid('setTreeContainer', settings.getTreeGridContainer.apply(this));
				$this.treegrid('getChildNodes').treegrid('initNode', settings);
				$this.treegrid('initExpander').treegrid('initIndent').treegrid('initDrag').treegrid('initEvents').treegrid('initState').treegrid('initChangeEvent').treegrid("initSettingsEvents");
			});
		},
		initDrag: function(){
			var $this = $(this);
			if( $this.treegrid('getSetting', 'draggable' )){
				var options = {},
					drag = {droppable:true, draggable:true }, 
					optstr = $this.attr('data-treegrid-drag');
				if( optstr !== undefined ){
					options = Utils.options(optstr);
				}
				$.extend(drag, options);
				$this.data('dragOptions', drag);
				$this.attr('draggable', true );        
			}
			return $this;
		},
		initDragAcc: function(settings){
			var $this = $(this);
			if( settings.draggable ){
				var options = {},
					drag = {droppable:true, draggable:true }, 
					optstr = $this.attr('data-treegrid-drag');
				if( optstr !== undefined ){
					options = Utils.options(optstr);
				}
				$.extend(drag, options);
				$this.data('dragOptions', drag);
				$this.attr('draggable', true );        
			}
			return $this;
		},

		initChangeEvent: function() {
			var $this = $(this);
			//Save state on change
			$this.on("change", function() {
				var $this = $(this);
				$this.treegrid('render');
				if ($this.treegrid('getSetting', 'saveState')) {
					$this.treegrid('saveState');
				}
			});
			return $this;
		},
		/**
		 * Initialize node events
		 *
		 * @returns {Node}
		 */
		initEvents: function() {
			var $this = $(this);
			//Default behavior on collapse
			$this.on("collapse", function() {
				var $this = $(this);
				$this.removeClass('treegrid-expanded');
				$this.addClass('treegrid-collapsed');
			});
			//Default behavior on expand
			$this.on("expand", function() {
				var $this = $(this);
				$this.removeClass('treegrid-collapsed');
				$this.addClass('treegrid-expanded');
			});

			if( $this.treegrid('isDraggable') ){
				this.on("dragstart", function(ev) {
					var $this = $(this);
					ev.originalEvent.dataTransfer.setData("src_id", $this.treegrid('getNodeId'));
				});
			}
			if( $this.treegrid('isDroppable') ){
				this.on("dragover", function(ev){                    
				   ev.preventDefault();
				});
				this.on( "drop", function(ev){
					ev.preventDefault();
					var id = ev.originalEvent.dataTransfer.getData("src_id"), 
						$this = $(this),
						nid = $this.treegrid('getNodeId'),
						$srcNode = $(this).treegrid('getSetting', 'getNodeById').apply(this, [id, $(this).treegrid('getTreeContainer')]),
						orgParentId = $srcNode.treegrid('getParentNodeId');
					if( id === nid || $srcNode.treegrid('isAncestor', nid)){
						return;
					}
					if( $this.treegrid('getSetting', 'renderOnDrag')){
						$(this).treegrid('appendChild', id );
					}
					
					$this.treegrid('getSetting', 'onMove').apply($this, [id,$this.treegrid('getNodeId'),orgParentId]);
					return false;
				});
			}
			if( $this.treegrid('getSetting', 'selectable' )){
			   this.on("click", function(ev){
					var $this = $(this),
						cls = $this.treegrid('getSetting', 'selectedClass');
					$('.'+cls).removeClass(cls);
					$this.addClass( cls );
					$this.treegrid('getSetting', 'onSelected').apply($this, [$this.treegrid('getNodeId')]);
			   });
			}

			return $this;
		},
		initEventsAcc: function(settings) {
			var $this = $(this);
			//Default behavior on collapse
			$this.on("collapse", function() {
				var $this = $(this);
				$this.removeClass('treegrid-expanded');
				$this.addClass('treegrid-collapsed');
			});
			//Default behavior on expand
			$this.on("expand", function() {
				var $this = $(this);
				$this.removeClass('treegrid-collapsed');
				$this.addClass('treegrid-expanded');
			});

			if( settings.draggable ){
				this.on("dragstart", function(ev) {
					var $this = $(this);
					ev.originalEvent.dataTransfer.setData("src_id", $this.treegrid('getNodeId'));
				});
			
				this.on("dragover", function(ev){                    
				   ev.preventDefault();
				});
				this.on( "drop", function(ev){
					ev.preventDefault();
					var id = ev.originalEvent.dataTransfer.getData("src_id"), 
						$this = $(this),
						nid = $this.treegrid('getNodeId'),
						$srcNode = $(this).treegrid('getSetting', 'getNodeById').apply(this, [id, $(this).treegrid('getTreeContainer')]),
						orgParentId = $srcNode.treegrid('getParentNodeId');
					if( id === nid || $srcNode.treegrid('isAncestor', nid)){
						return;
					}
					if( $this.treegrid('getSetting', 'renderOnDrag')){
						$(this).treegrid('appendChild', id );
					}
					
					$this.treegrid('getSetting', 'onMove').apply($this, [id,$this.treegrid('getNodeId'),orgParentId]);
					return false;
				});
			}
			if( settings.selectable ){
			   this.on("click", function(ev){
					var $this = $(this),
						cls = $this.treegrid('getSetting', 'selectedClass');
					$('.'+cls).removeClass(cls);
					$this.addClass( cls );
					$this.treegrid('getSetting', 'onSelected').apply($this, [$this.treegrid('getNodeId')]);
			   });
			}

			return $this;
		},

		appendChild: function(id, isprepend){
			var $this = $(this),
				parentId = $this.treegrid('getNodeId'),
				$child = $(this).treegrid('getSetting', 'getNodeById').apply(this, [id, $(this).treegrid('getTreeContainer')]),         
				childIsLeaf = $child.treegrid('isLeaf'),
				childDepth = $child.treegrid('getDepth'),
				parentDepth = $this.treegrid('getDepth'),
				orgParentId = $child.treegrid('getParentNodeId'),
				$orgParent = $child.treegrid('getParentNode'),
				$beforenode, $son, 
				$sons=$child.treegrid('getDescendant');

			if( parentId === id ){
				return;
			}
			if( $child.treegrid('isAncestor', parentId)){
				return;
			}

			$child.removeClass('treegrid-parent-' + orgParentId);
			$child.addClass('treegrid-parent-' + parentId);
			$beforenode = $this;
			if( !isprepend ){
				if( !$this.treegrid('isLeaf')){
					var $sibling = $this.next();                
					while( $sibling.length > 0 ){
					   var depth = $sibling.treegrid('getDepth'); 
					   if( depth <= parentDepth ){
							break;
					   }
					   $beforenode = $sibling;
					   $sibling = $sibling.next();
					}
				}
			}
			$beforenode.after($child);
			
			$child.treegrid('initIndent');
			$this.trigger("change");            
			if(!$this.treegrid('isExpanded')){
				$this.treegrid('expand')  
			}
			$this.treegrid('initIndent');

			if( $orgParent !== null ){
				$orgParent.trigger("change");
				if( $orgParent.treegrid('isLeaf')){
					$orgParent.treegrid('initExpander');
					$orgParent.treegrid('initIndent');
				}  
			}
			
			if( !childIsLeaf ){
				$child.after($sons);
				$.each($sons, function(i,$s){
					$s.treegrid('initIndent');
				});
			}
		},

		getSelectedId: function(){
			var $this = $(this),
				cls = $this.treegrid('getSetting', 'selectedClass'),
				$node = $this.treegrid('getTreeContainer').find('tr.'+cls);
			if( $node )
				return $node.treegrid('getNodeId');
			else 
				return null;
		},

		newNode: function(id){
			var $this = $(this),
				$node = $(this).treegrid('getSetting', 'getNodeById').apply(this, [id, $(this).treegrid('getTreeContainer')]);
			$node.treegrid('initNode', $this.treegrid('getTreeContainer').data('settings'));
		},

		remove: function(){
			var $this = $(this),
				$parent = $(this).treegrid('getParentNode');
			$this.remove();
			if($parent){
				$parent.trigger("change");
				if( $parent.treegrid('isLeaf')){
					$parent.treegrid('initExpander');
					$parent.treegrid('initIndent');
				}  
			}
		},

		up: function(){
			var $this = $(this);
			if( $this.treegrid('isFirst')){
				return;
			}

			var $prev = $this.treegrid('prev'),
				$descendant = $this.treegrid('getDescendant');
			$prev.before($this);
			$prev.before($descendant);
		},

		down: function(){
			var $this = $(this);
			if( $this.treegrid('isLast')){
				return;
			}

			var $next = $this.treegrid('next'),
				$descendant = $this.treegrid('getDescendant'),
				$nextchild = $next.treegrid('getDescendant');
			if( $next.treegrid('isLeaf') ){
				$next.after($descendant);
				$next.after($this);
			}else{
				var $last = $nextchild.pop();
				$last.after($descendant);
				$last.after($this);
			}            
		},

		upgrade: function(){
			var $this = $(this),
				$parentNode = $this.treegrid('getParentNode'),
				parentId = $this.treegrid('getParentNodeId'), 
				$descendant = $this.treegrid('getDescendant'),
				id =  $this.treegrid('getNodeId'),
				$sibling = [], $tmp, i;
			if( $parentNode === null ){
				return;
			}
			$tmp = $this;
			while($tmp = $tmp.treegrid('next')){
				$sibling.push($tmp);                
			}

			var $grandNode = $parentNode.treegrid('getParentNode');
			$this.removeClass('treegrid-parent-' + parentId);
			if( $grandNode !== null ){
				$this.addClass('treegrid-parent-' + $grandNode.treegrid('getNodeId'));
			}
			$this.treegrid('initIndent');
			$.each($descendant, function(i,$s){
				$s.treegrid('initIndent');
			});

			$parentNode.trigger("change");
			if( $parentNode.treegrid('isLeaf')){
				$parentNode.treegrid('initExpander');
				$parentNode.treegrid('initIndent');
			}

			for( i = 0; i < $sibling.length; i++ ){
				var $s = $sibling[i],
					nid = $s.treegrid('getNodeId');
				$s.removeClass('treegrid-parent-' + parentId);
				$s.addClass('treegrid-parent-' + id);
				$s.treegrid('getSetting', 'onMove').apply($s, [nid,id]);   
			}                 
		},

		prev: function(){
			var $this = $(this);
			if( $this.treegrid('isFirst')){
				return null;
			}

			var parentNode = $(this).treegrid('getParentNode'),
				nodes, i, $prev,
				id = $this.treegrid('getNodeId');
			if (parentNode === null) {
				nodes = $(this).treegrid('getRootNodes');
			}else{
				nodes = parentNode.treegrid('getChildNodes');
			}

			for( i = 0; i < nodes.length; i++ ){
				var n = nodes[i];
				if($(n).treegrid('getNodeId')===id){
					break;
				}
				$prev = $(n);
			}
			return $prev;
		},

		next: function(){
			var $this = $(this);
			if( $this.treegrid('isLast')){
				return null;
			}

			var parentNode = $(this).treegrid('getParentNode'),
				nodes, i, $next,
				id = $this.treegrid('getNodeId');
			if (parentNode === null) {
				nodes = $(this).treegrid('getRootNodes');
			}else{
				nodes = parentNode.treegrid('getChildNodes');
			}

			for( i = 0; i < nodes.length; i++ ){
				var n = nodes[i];
				if($(n).treegrid('getNodeId')===id){
					$next = $(nodes[i+1]);
					break;
				}
			}
			return $next;
		},

		getDescendant: function(){
			var $this = $(this),
				depth = $this.treegrid('getDepth'),
				$s, $descendant = [];
			$s = $this.next();
			while( $s.length > 0 ){
				var childdepth = $s.treegrid('getDepth');
				if(childdepth <= depth ){
					break;
				}
				$descendant.push($s);
				$s = $s.next();
			}
			return $descendant;
		},

		/**
		 * Initialize events from settings
		 *
		 * @returns {Node}
		 */
		initSettingsEvents: function() {
			var $this = $(this);
			//Save state on change
			$this.on("change", function() {
				var $this = $(this);
				if (typeof($this.treegrid('getSetting', 'onChange')) === "function") {
					$this.treegrid('getSetting', 'onChange').apply($this);
				}
			});
			//Default behavior on collapse
			$this.on("collapse", function() {
				var $this = $(this);
				if (typeof($this.treegrid('getSetting', 'onCollapse')) === "function") {
					$this.treegrid('getSetting', 'onCollapse').apply($this);
				}
			});
			//Default behavior on expand
			$this.on("expand", function() {
				var $this = $(this);
				if (typeof($this.treegrid('getSetting', 'onExpand')) === "function") {
					$this.treegrid('getSetting', 'onExpand').apply($this);
				}

			});

			return $this;
		},
		/**
		 * Initialize expander for node
		 *
		 * @returns {Node}
		 */
		initExpander: function() {
			var $this = $(this);
			var cell = $this.find('td').get($this.treegrid('getSetting', 'treeColumn'));
			var tpl = $this.treegrid('getSetting', 'expanderTemplate');
			var expander = $this.treegrid('getSetting', 'getExpander').apply(this);
			if (expander) {
				expander.remove();
			}
			$(tpl).prependTo(cell).click(function() {
				$($(this).closest('tr')).treegrid('toggle');
			});

			var type = $this.attr('data-treegrid-type');
			if( type !== undefined ){
				$this.find('.treegrid-expander').addClass($this.treegrid('getSetting', 'nodeClasses')[type]);
			}else{
				$this.find('.treegrid-expander').addClass($this.treegrid('getSetting', 'leafClass'));
			}
			//expander = $this.find('.treegrid-expander');
			//$this.treegrid('getSetting', 'expanderTemplate');
			return $this;
		},
		/* 初始化Expander加速方法 */
		initExpanderAcc: function(ss) {
			var $this = $(this);
			var settings = ss==undefined?$this.treegrid('getSettings'):ss;
			var cell = $this.find('td').get(settings.treeColumn);
			var $tpl = $(settings.expanderTemplate);
			/*var expander = $this.find('.treegrid-expander');
			if (expander) {
				expander.remove();
			}*/
			$tpl.prependTo(cell).click(function() {
				$($(this).closest('tr')).treegrid('toggle');
			});
			
			
			var type = $this.attr('data-treegrid-type');
			if( type !== undefined ){
				$tpl.addClass(settings.nodeClasses[type]);
			}else{
				$tpl.addClass(settings.leafClass);
			}
			return $this;
		},
		/**
		 * Initialize indent for node
		 *
		 * @returns {Node}
		 */
		initIndent: function(level) {
			var $this = $(this);
			$this.find('.treegrid-indent').remove();
			var tpl = $this.treegrid('getSetting', 'indentTemplate');
			var expander = $this.find('.treegrid-expander');
			var depth = level === undefined ? $this.treegrid('getDepth'):level;
			for (var i = 0; i < depth; i++) {
				$(tpl).insertBefore(expander);
			}
			return $this;
		},
		initIndentAcc: function(settings,level) {
			var $this = $(this);
			$this.find('.treegrid-indent').remove();
			var tpl = settings.indentTemplate;
			var expander = $this.find('.treegrid-expander');
			var depth = level === undefined ? $this.treegrid('getDepth'):level;
			for (var i = 0; i < depth; i++) {
				$(tpl).insertBefore(expander);
			}
			return $this;
		},
		/**
		 * Initialise state of node
		 *
		 * @returns {Node}
		 */
		initState: function() {
			var $this = $(this);
			if ($this.treegrid('getSetting', 'saveState') && !$this.treegrid('isFirstInit')) {
				$this.treegrid('restoreState');
			} else {
				if ($this.treegrid('getSetting', 'initialState') === "expanded") {
					$this.treegrid('expand');
				} else {
					$this.treegrid('collapse');
				}
			}
			return $this;
		},
		/**
		 * Return true if this tree was never been initialised
		 *
		 * @returns {Boolean}
		 */
		isFirstInit: function() {
			var tree = $(this).treegrid('getTreeContainer');
			if (tree.data('first_init') === undefined) {
				tree.data('first_init', $.cookie(tree.treegrid('getSetting', 'saveStateName')) === undefined);
			}
			return tree.data('first_init');
		},
		/**
		 * Save state of current node
		 *
		 * @returns {Node}
		 */
		saveState: function() {
			var $this = $(this);
			if ($this.treegrid('getSetting', 'saveStateMethod') === 'cookie') {

				var stateArrayString = $.cookie($this.treegrid('getSetting', 'saveStateName')) || '';
				var stateArray = (stateArrayString === '' ? [] : stateArrayString.split(','));
				var nodeId = $this.treegrid('getNodeId');

				if ($this.treegrid('isExpanded')) {
					if ($.inArray(nodeId, stateArray) === -1) {
						stateArray.push(nodeId);
					}
				} else if ($this.treegrid('isCollapsed')) {
					if ($.inArray(nodeId, stateArray) !== -1) {
						stateArray.splice($.inArray(nodeId, stateArray), 1);
					}
				}
				$.cookie($this.treegrid('getSetting', 'saveStateName'), stateArray.join(','));
			}
			return $this;
		},
		/**
		 * Restore state of current node.
		 *
		 * @returns {Node}
		 */
		restoreState: function() {
			var $this = $(this);
			if ($this.treegrid('getSetting', 'saveStateMethod') === 'cookie') {
				var stateArray = $.cookie($this.treegrid('getSetting', 'saveStateName')).split(',');
				if ($.inArray($this.treegrid('getNodeId'), stateArray) !== -1) {
					$this.treegrid('expand');
				} else {
					$this.treegrid('collapse');
				}

			}
			return $this;
		},
		/**
		 * Method return setting by name
		 *
		 * @param {type} name
		 * @returns {unresolved}
		 */
		getSetting: function(name) {
			if (!$(this).treegrid('getTreeContainer')) {
				return null;
			}
			return $(this).treegrid('getTreeContainer').data('settings')[name];
		},
		/* add by qiuzy*/
		getSettings: function(name) {
			if (!$(this).treegrid('getTreeContainer')) {
				return null;
			}
			return $(this).treegrid('getTreeContainer').data('settings');
		},
		/**
		 * Add new settings
		 *
		 * @param {Object} settings
		 */
		setSettings: function(settings) {
			$(this).treegrid('getTreeContainer').data('settings', settings);
		},
		/**
		 * Return tree container
		 *
		 * @returns {HtmlElement}
		 */
		getTreeContainer: function() {
			return $(this).data('treegrid');
		},
		/**
		 * Set tree container
		 *
		 * @param {HtmlE;ement} container
		 */
		setTreeContainer: function(container) {
			return $(this).data('treegrid', container);
		},
		/**
		 * Method return all root nodes of tree.
		 *
		 * Start init all child nodes from it.
		 *
		 * @returns {Array}
		 */
		getRootNodes: function() {
			return $(this).treegrid('getSetting', 'getRootNodes').apply(this, [$(this).treegrid('getTreeContainer')]);
		},
		/**
		 * Method return all nodes of tree.
		 *
		 * @returns {Array}
		 */
		getAllNodes: function() {
			return $(this).treegrid('getSetting', 'getAllNodes').apply(this, [$(this).treegrid('getTreeContainer')]);
		},
		/**
		 * Mthod return true if element is Node
		 *
		 * @returns {String}
		 */
		isNode: function() {
			return $(this).treegrid('getNodeId') !== null;
		},
		/**
		 * Mthod return id of node
		 *
		 * @returns {String}
		 */
		getNodeId: function() {
			if ($(this).treegrid('getSetting', 'getNodeId') === null) {
				return null;
			} else {
				return $(this).treegrid('getSetting', 'getNodeId').apply(this);
			}
		},
		/**
		 * Method return parent id of node or null if root node
		 *
		 * @returns {String}
		 */
		getParentNodeId: function() {
			return $(this).treegrid('getSetting', 'getParentNodeId').apply(this);
		},
		/**
		 * Method return parent node or null if root node
		 *
		 * @returns {Object[]}
		 */
		getParentNode: function() {
			if ($(this).treegrid('getParentNodeId') === null) {
				return null;
			} else {
				return $(this).treegrid('getSetting', 'getNodeById').apply(this, [$(this).treegrid('getParentNodeId'), $(this).treegrid('getTreeContainer')]);
			}
		},
		/**
		 * Method return array of child nodes or null if node is leaf
		 *
		 * @returns {Object[]}
		 */
		getChildNodes: function() {
			return $(this).treegrid('getSetting', 'getChildNodes').apply(this, [$(this).treegrid('getNodeId'), $(this).treegrid('getTreeContainer')]);
		},
		/**
		 * Method return depth of tree.
		 *
		 * This method is needs for calculate indent
		 *
		 * @returns {Number}
		 */
		getDepth: function() {
			if ($(this).treegrid('getParentNode') === null) {
				return 0;
			}
			return $(this).treegrid('getParentNode').treegrid('getDepth') + 1;
		},
		/**
		 * Method return true if node is root
		 *
		 * @returns {Boolean}
		 */
		isRoot: function() {
			return $(this).treegrid('getDepth') === 0;
		},
		/**
		 * Method return true if node has no child nodes
		 *
		 * @returns {Boolean}
		 */
		isLeaf: function() {
			return $(this).treegrid('getChildNodes').length === 0;
		},
		/**
		 * Method return true if node last in branch
		 *
		 * @returns {Boolean}
		 */
		isLast: function() {
			if ($(this).treegrid('isNode')) {
				var parentNode = $(this).treegrid('getParentNode');
				if (parentNode === null) {
					if ($(this).treegrid('getNodeId') === $(this).treegrid('getRootNodes').last().treegrid('getNodeId')) {
						return true;
					}
				} else {
					if ($(this).treegrid('getNodeId') === parentNode.treegrid('getChildNodes').last().treegrid('getNodeId')) {
						return true;
					}
				}
			}
			return false;
		},
		/**
		 * Method return true if node first in branch
		 *
		 * @returns {Boolean}
		 */
		isFirst: function() {
			if ($(this).treegrid('isNode')) {
				var parentNode = $(this).treegrid('getParentNode');
				if (parentNode === null) {
					if ($(this).treegrid('getNodeId') === $(this).treegrid('getRootNodes').first().treegrid('getNodeId')) {
						return true;
					}
				} else {
					if ($(this).treegrid('getNodeId') === parentNode.treegrid('getChildNodes').first().treegrid('getNodeId')) {
						return true;
					}
				}
			}
			return false;
		},
		/**
		 * Return true if node expanded
		 *
		 * @returns {Boolean}
		 */
		isExpanded: function() {
			return $(this).hasClass('treegrid-expanded');
		},
		/**
		 * Return true if node collapsed
		 *
		 * @returns {Boolean}
		 */
		isCollapsed: function() {
			return $(this).hasClass('treegrid-collapsed');
		},
		/**
		 * Return true if at least one of parent node is collapsed
		 *
		 * @returns {Boolean}
		 */
		isOneOfParentsCollapsed: function() {
			var $this = $(this);
			if ($this.treegrid('isRoot')) {
				return false;
			} else {
				if ($this.treegrid('getParentNode').treegrid('isCollapsed')) {
					return true;
				} else {
					return $this.treegrid('getParentNode').treegrid('isOneOfParentsCollapsed');
				}
			}
		},
		isDraggable: function(){
			var $this = $(this);
			if( $this.treegrid('getSetting', 'draggable' )){
				return $this.data('dragOptions').draggable;
			}
			return false;
		},
		isDroppable: function(){
			var $this = $(this);
			if( $this.treegrid('getSetting', 'draggable' )){
				return $this.data('dragOptions').droppable;
			}
			return false;
		},
		isAncestor: function(childid){
			var $this = $(this),
				id = $this.treegrid('getNodeId'),
				$child = $this.treegrid('getSetting', 'getNodeById').apply(this, [childid, $(this).treegrid('getTreeContainer')]),
				$parent, pid;

			$parent = $child.treegrid('getParentNode');
			while( $parent !== null ){
				pid = $parent.treegrid('getNodeId');
				if( pid === id ){
					return true;
				}  
				$parent = $parent.treegrid('getParentNode');
			}
			return false;
		}, 

		/**
		 * Expand node
		 *
		 * @returns {Node}
		 */
		expand: function() {
			if (!this.treegrid('isLeaf') && !this.treegrid("isExpanded")) {
				this.trigger("expand");
				this.trigger("change");
				return this;
			}
			return this;
		},
		/**
		 * Expand all nodes
		 *
		 * @returns {Node}
		 */
		expandAll: function() {
			var $this = $(this);
			$this.treegrid('getRootNodes').treegrid('expandRecursive');
			return $this;
		},
		/**
		 * Expand current node and all child nodes begin from current
		 *
		 * @returns {Node}
		 */
		expandRecursive: function() {
			return $(this).each(function() {
				var $this = $(this);
				$this.treegrid('expand');
				if (!$this.treegrid('isLeaf')) {
					$this.treegrid('getChildNodes').treegrid('expandRecursive');
				}
			});
		},
		/**
		 * Collapse node
		 *
		 * @returns {Node}
		 */
		collapse: function() {
			return $(this).each(function() {
				var $this = $(this);
				if (!$this.treegrid('isLeaf') && !$this.treegrid("isCollapsed")) {
					$this.trigger("collapse");
					$this.trigger("change");
				}
			});
		},
		/**
		 * Collapse all nodes
		 *
		 * @returns {Node}
		 */
		collapseAll: function() {
			var $this = $(this);
			$this.treegrid('getRootNodes').treegrid('collapseRecursive');
			return $this;
		},
		/**
		 * Collapse current node and all child nodes begin from current
		 *
		 * @returns {Node}
		 */
		collapseRecursive: function() {
			return $(this).each(function() {
				var $this = $(this);
				$this.treegrid('collapse');
				if (!$this.treegrid('isLeaf')) {
					$this.treegrid('getChildNodes').treegrid('collapseRecursive');
				}
			});
		},
		/**
		 * Expand if collapsed, Collapse if expanded
		 *
		 * @returns {Node}
		 */
		toggle: function() {
			var $this = $(this);
			if ($this.treegrid('isExpanded')) {
				$this.treegrid('collapse');
			} else {
				$this.treegrid('expand');
			}
			return $this;
		},
		/**
		 * Rendering node
		 *
		 * @returns {Node}
		 */
		render: function() {
			return $(this).each(function() {
				var $this = $(this);
				//if parent colapsed we hidden
				if ($this.treegrid('isOneOfParentsCollapsed')) {
					$this.hide();
				} else {
					$this.show();
				}
				if (!$this.treegrid('isLeaf')) {
					$this.treegrid('renderExpander');
					$this.treegrid('getChildNodes').treegrid('render');
				}
			});
		},
		/**
		 * Rendering expander depends on node state
		 *
		 * @returns {Node}
		 */
		renderExpander: function() {
			return $(this).each(function() {
				var $this = $(this);
				var expander = $this.treegrid('getSetting', 'getExpander').apply(this);
				if (expander) {
					if (!$this.treegrid('isCollapsed')) {
						expander.removeClass($this.treegrid('getSetting', 'expanderCollapsedClass'));
						expander.addClass($this.treegrid('getSetting', 'expanderExpandedClass'));
					} else {
						expander.removeClass($this.treegrid('getSetting', 'expanderExpandedClass'));
						expander.addClass($this.treegrid('getSetting', 'expanderCollapsedClass'));
					}                     
				} else {
					$this.treegrid('initExpander');
					$this.treegrid('renderExpander');
				}
			});
		}
	};
	$.fn.treegrid = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.initTree.apply(this, arguments);
		} else {
			$.error('Method with name ' + method + ' does not exists for jQuery.treegrid');
		}
	};
	/**
	 *  Plugin's default options
	 */
	$.fn.treegrid.defaults = {
		initialState: 'expanded',
		saveState: false,
		saveStateMethod: 'cookie',
		saveStateName: 'tree-grid-state',
		expanderTemplate: '<span class="treegrid-expander"></span>',
		indentTemplate: '<span class="treegrid-indent"></span>',
		expanderExpandedClass: 'treegrid-expander-expanded',
		expanderCollapsedClass: 'treegrid-expander-collapsed',
		leafClass: 'treegrid-expander-collapsed',
		treeColumn: 0,
		draggable: false,
		renderOnDrag: false,
		selectable: false,
		selectedClass: 'treegrid-selected',
		getExpander: function() {
			return $(this).find('.treegrid-expander');
		},
		getNodeId: function() {
			var template = /treegrid-([A-Za-z0-9_-]+)/;
			if (template.test($(this).attr('class'))) {
				return template.exec($(this).attr('class'))[1];
			}
			return null;
		},
		getParentNodeId: function() {
			var template = /treegrid-parent-([A-Za-z0-9_-]+)/;
			if (template.test($(this).attr('class'))) {
				return template.exec($(this).attr('class'))[1];
			}
			return null;
		},
		getNodeById: function(id, treegridContainer) {
			var templateClass = "treegrid-" + id;
			return treegridContainer.find('tr.' + templateClass);
		},
		getChildNodes: function(id, treegridContainer) {
			var templateClass = "treegrid-parent-" + id;
			return treegridContainer.find('tr.' + templateClass);
		},
		getTreeGridContainer: function() {
			return $(this).closest('table');
		},
		getRootNodes: function(treegridContainer) {
			var result = $.grep(treegridContainer.find('tr'), function(element) {
				var classNames = $(element).attr('class');
				var templateClass = /treegrid-([A-Za-z0-9_-]+)/;
				var templateParentClass = /treegrid-parent-([A-Za-z0-9_-]+)/;
				return templateClass.test(classNames) && !templateParentClass.test(classNames);
			});
			return $(result);
		},
		getAllNodes: function(treegridContainer) {
			var result = $.grep(treegridContainer.find('tr'), function(element) {
				var classNames = $(element).attr('class');
				var templateClass = /treegrid-([A-Za-z0-9_-]+)/;
				return templateClass.test(classNames);
			});
			return $(result);
		},
		//Events
		onCollapse: null,
		onExpand: null,
		onChange: null,
		onMove: function(){},
		onSelected: function(){}

	};
})(jQuery);
