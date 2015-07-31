Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    _startDate:null,
    _endDate:null,
    _createdDefectCount:0,
    _fixedDefectCount:0,
    _adminClosedDefectCount:0,
    launch: function() {
	var that = this;
	var minDate = new Date(new Date() - 86400000*360); //minDate cannot be further than one year
	var datePicker = Ext.create('Ext.panel.Panel', {
	    bodyPadding: 10,
	    renderTo: Ext.getBody(),
	    layout: 'hbox',
	    items: [{
		xtype: 'rallydatepicker',
		itemId: 'from',
		minDate: minDate,
                showToday: false,
                margin: '10 20 20 10',
		handler: function(picker, date) {
		    that._onStartDateSelected(date);
		    }
		},
		{
		xtype: 'rallydatepicker',
		itemId: 'to',
		minDate: minDate,
                margin:'10 20 20 10',
                showToday: false,
		handler: function(picker, date) {
		     that._onEndDateSelected(date);
		}
	    }],
            maxWidth: 450
	});        
	this.add(datePicker);
	var panel =  Ext.create('Ext.panel.Panel', {
	    id:'infoPanel',
            padding: '10 10 10 10',
	    componentCls: 'panel',
            html: 'CHOOSE START AND END DATES:',
            maxWidth: 450
	});
	this.add(panel);
    },
    _onStartDateSelected:function(date){
	console.log(date);
	this._startDate = Rally.util.DateTime.format(new Date(date), 'Y-m-d');
	if (this._endDate) {
	    Ext.getCmp('infoPanel').update('DATE RANGE: ' + this._startDate + ' and ' + this._endDate);
	    this._getCreatedDefects();
	}
	else{
	    Ext.getCmp('infoPanel').update('START DATE SELECTED: ' + this._startDate + '. PICK END DATE');
	}
    },
   
    _onEndDateSelected:function(date){
	console.log(date);
	this._endDate = Rally.util.DateTime.format(new Date(date), 'Y-m-d');
	Ext.getCmp('infoPanel').update('DATE RANGE: ' + this._startDate + ' and ' + this._endDate);
	this._getCreatedDefects();
    },   
	
    _getCreatedDefects: function(){
        var filters = [
	    {
		property : 'CreationDate',
		operator : '>=',
		value : this._startDate
	    },
	    {
		property : 'CreationDate',
		operator : '<=',
		value : this._endDate
	    },
	    {
		property : 'Tags.Name',
		operator: 'contains',
		value: 'Customer Voice'
	    }
	];
        var myStore = Ext.create('Rally.data.wsapi.Store',{
            model: 'Defect',
            autoLoad:true,
            fetch: ['Name','State','FormattedID'],
            filters:filters,
            listeners: {
                load: function(store,records,success){
                    this._createdDefectCount = records.length;
                    this._getFixedDefects();
                },
                scope:this
            }
        });
    },
    
     _getFixedDefects: function(){
        var filters = Rally.data.wsapi.Filter.and([
            {
		property : 'ClosedDate',
		operator : '>=',
		value : this._startDate
	    },
	    {
		property : 'ClosedDate',
		operator : '<=',
		value : this._endDate
	    },
	    {
		property : 'Tags.Name',
		operator: 'contains',
		value: 'Customer Voice'
	    },
            {
                property : 'State',
		value: 'Closed'
            },
            Rally.data.wsapi.Filter.or([
            {
		property : 'Resolution',
		value : 'Code Change'
	    },
	    {
		property : 'Resolution',
		value : 'Database/Metadata Change'
	    },
	    {
		property : 'Resolution',
		value: 'Configuration Change'
	    },
            ])
        ])
        var myStore = Ext.create('Rally.data.wsapi.Store',{
            model: 'Defect',
            autoLoad:true,
            fetch: ['Name','State','FormattedID'],
            filters:filters,
            listeners: {
                load: function(store,records,success){
                    this._fixedDefectCount = records.length;
                    this._getAdminClosedDefects();
                },
                scope:this
            }
        });
    },
    
    _getAdminClosedDefects:function(){
        var filters = Rally.data.wsapi.Filter.and([
            {
		property : 'ClosedDate',
		operator : '>=',
		value : this._startDate
	    },
	    {
		property : 'ClosedDate',
		operator : '<=',
		value : this._endDate
	    },
	    {
		property : 'Tags.Name',
		operator: 'contains',
		value: 'Customer Voice'
	    },
            {
                property : 'State',
		value: 'Closed'
            },
            Rally.data.wsapi.Filter.or([
            {
		property : 'Resolution',
                operator: '!=',
		value : 'Code Change'
	    },
	    {
		property : 'Resolution',
                operator: '!=',
		value : 'Database/Metadata Change'
	    },
	    {
		property : 'Resolution',
                operator: '!=',
		value: 'Configuration Change'
	    }
            ])
        ]);
        var myStore = Ext.create('Rally.data.wsapi.Store',{
            model: 'Defect',
            autoLoad:true,
            fetch: ['Name','State','FormattedID'],
            filters:filters,
            listeners: {
                load: function(store,records,success){
                    this._adminClosedDefectCount = records.length;
                    this._makeStore();
                },
                scope:this
            }
        });
    },
    
    _makeStore:function(){
        var records = [];
        var d = {
            "CreatedDefects" : this._createdDefectCount,
            "FixedDefects" : this._fixedDefectCount,
            "AdminClosedDefects" : this._adminClosedDefectCount
        };
        records.push(d);
        this._makeGrid(records);
    },
    _makeGrid:function(records){
        if (this._grid) {
            this._grid.destroy();
        }
        this._grid = Ext.create('Rally.ui.grid.Grid', {
            itemId: 'defectGrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: records
            }),
            columnCfgs: [
                {
                    text: 'Created Defects',
                    dataIndex: 'CreatedDefects'
                },
                {
                    text: 'Fixed Defect',
                    dataIndex: 'FixedDefects'
                },
                {
                    text: 'Administratively Closed Defects',
                    dataIndex: 'AdminClosedDefects'
                }
            ]
        });
        this.add(this._grid);
        
    }
});