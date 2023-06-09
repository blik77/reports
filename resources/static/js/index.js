var mainPanel, menu_report = [], charts = [], tables = [], disable_chart_resize = true;
var charts_modal = [], window_modal = null;
Ext.onReady(function(){ loadMenu(); });
function updateLayout(){
    let timerId = setInterval(() => {
        mainPanel.updateLayout();
    }, 1000);
    setTimeout(() => { clearInterval(timerId); disable_chart_resize = false; }, 2000);
}
function viewPage(){
    mainPanel = Ext.create('Ext.Panel', {
        title: '',
        layout: {
            type: 'vbox',
            pack: 'start',
            align: 'stretch'
        },
        border: false,
        items: [],
        scrollable: true
    });
    Ext.create('Ext.container.Viewport', {
        border: false,
        layout: 'fit',
        items: [
            Ext.create('Ext.Panel', {
                layout: 'fit',
                height: window.innerHeight,
                border: false,
                items: [mainPanel],
                tbar: createMenu(menu_report, true)
            })
        ]
    });
    let start_menu_item = menu_report.find((el)=>{ return el.name === "ГЛАВНАЯ"; });
    if(start_menu_item !== undefined){
        loadReport(start_menu_item.idLink);
    }
}
function parseReport(panel, flag_modal){
    return panel.content ? panel.content.map((el)=>{
        if(el.type === 'panel'){
            return createPanel(el, flag_modal);
        } else if(el.type === 'table'){
            return createTable(el, flag_modal);
        } else if(el.type === 'html'){
            return createHTML(el, flag_modal);
        } else if(el.type === 'chart'){
            return createChart(el, flag_modal);
        }
    }) : [];
}
function createPanel(el, flag_modal){
    let config = {
        title: el.name || "",
        layout: {
            type: 'hbox',
            pack: 'start',
            align: 'stretch'
        },
        items: parseReport(el, flag_modal)
    };
    if(el.content){
        el.content.forEach((el_cont)=>{
            if(el_cont.type && el_cont.type !== 'panel'){
                config.layout.type = 'vbox';
            }
        });
        if(el.content.length > 0){
            config.border = false;
        }
    }
    if(config.layout.type === 'vbox'){
        if(el.width){
            config.width = el.width;
        } else {
            config.flex = 1;
        }
    }
    return Ext.create('Ext.Panel', config);
}
function createTable(el, flag_modal){
    let config_store = {
        fields: el.settings.fields.map(field => field.id).filter(el => el !== undefined),
        listeners: {
            'load': function(store, rec){
                $("a[param]").each(function(){
                    $(this).off('click').on('click', createChartModal);
                });
            }
        }
    };
    if(el.settings.data.id){
        config_store.proxy = {
            type: 'ajax',
            actionMethods: {read: 'GET'},
            url: '/api/get_data_for/' + el.settings.data.id,
            reader: { type: 'json' }
        };
        if(el.settings.data.settings){
            config_store.proxy.extraParams = el.settings.data.settings;
        }
        config_store.autoLoad = true;
    } else if(el.settings.data.data){
        config_store.data = el.settings.data.data;
    }
    let config_columns = el.settings.fields.map((field)=>{
        let config_column = {
            text: field.name || "",
            sortable: false,
            menuDisabled: true,
            dataIndex: field.id
        };
        if(field.width && field.width !== ""){
            config_column.width = field.width*1?field.width*1:field.width;
        } else { config_column.flex = 1; }
        return config_column;
    });
    let config = {
        title: el.name || "",
        disableSelection: true,
        //flex: 1,
        store: Ext.create('Ext.data.Store', config_store),
        columns: config_columns,
        tools: [
            { type: 'excel', callback: loadExcel }
        ]
    };
    if(el.width){ config.width = el.width; }
    if(el.height){ config.height = el.height; }
    let panel = Ext.create('Ext.grid.Panel', config);
    tables.push(panel);
    return panel;
}
function createHTML(el, flag_modal){
    let config = {
        title: el.name || "",
        html: el.content
    };
    if(el.width){ config.width = el.width; }
    if(el.height){ config.height = el.height; }
    return Ext.create('Ext.Panel', config);
}
function createChart(el, flag_modal){
    let config = {
        title: el.name || "",
        resource_id: el.resource_id || null,
        params: el.params || null,
        listeners: {
            'resize': function(chart_panel, w, h){
                if(disable_chart_resize){ return; }
                let chart = $('#chart_' + chart_panel.getItemId());
                if(chart && chart.highcharts()){
                    chart.highcharts().setSize(w, h - (chart_panel.title === "" ? 0 : 26));
                }
            }
        }
    };
    if(el.width){ config.width = el.width; }
    if(el.height){ config.height = el.height; }
    let panel = Ext.create('Ext.Panel', config);
    if(flag_modal){
        charts_modal.push(panel);
    } else {
        charts.push(panel);
    }
    return panel;
}
function createChartModal(){
    let param = $(this).attr('param');
    let id_shablon = $(this).attr('id_shablon')*1;
    let lang = $(this).attr('lang') || 'RUS';
    Ext.Ajax.request({
        url: '/api/get_element_for',
        method: 'POST',
        jsonData: { params: param, id_shablon: id_shablon, lang: lang },
        success: function(response){
            if(response.responseText.includes("Log in")){
                window.location.reload();
                return false;
            }
            let parse_response = JSON.parse(response.responseText);
            let modal_report = parseReport(parse_response, true);
            let modal_config = {
                title: parse_response.name || "",
                scrollable: true,
                modal: false,
                items: [
                    Ext.create('Ext.Panel', {
                        title: '',
                        layout: {
                            type: 'vbox',
                            pack: 'start',
                            align: 'stretch'
                        },
                        items: modal_report
                    })
                ],
                listeners: {
                    'show': function(){
                        setTimeout(()=>{ window_modal.updateLayout(); }, 500);
                    }
                }
            };
            if(parse_response.X){ modal_config.x = parse_response.X * 1; }
            if(parse_response.X){ modal_config.y = parse_response.X * 1; }
            if(parse_response.height){
                if(parse_response.height * 1){
                    modal_config.height = parse_response.height * 1;
                } else {
                    modal_config.height = parse_response.height;
                }
            } else {
                modal_config.height = 300;
            }
            if(parse_response.width){
                if(parse_response.width * 1){
                    modal_config.width = parse_response.width * 1;
                } else {
                    modal_config.width = parse_response.width;
                }
            } else {
                modal_config.width = 300;
            }
            window_modal = Ext.create('eikonWin', modal_config);
            charts_modal.forEach((panel)=>{ loadChartData(panel, true); });
            charts_modal = [];
            window_modal.show();
        },
        failure: function(response){ }
    });
}
function createTableModal(){

    console.log($(this).attr('KID'));
}
function loadReport(id){
    Ext.Ajax.request({
        url: '/api/get_report/' + id,
        method: 'GET',
        success: function(response){
            if(response.responseText.includes("Log in")){
                window.location.reload();
                return false;
            }
            let report = JSON.parse(response.responseText);
            mainPanel.removeAll();
            charts = [];
            tables = [];
            mainPanel.setTitle(report.name);
            mainPanel.add(parseReport(report));
            charts.forEach((panel)=>{ loadChartData(panel); });
            disable_chart_resize = true;
            updateLayout();
            $("a.report_link[param]").each(function(){
                $(this).off('click').on('click', createChartModal);
            });
        },
        failure: function(response){ }
    });
}
function loadMenu(){
    Ext.Ajax.request({
        url: '/api/get_menu/',
        method: 'GET',
        success: function(response){
            if(response.responseText.includes("Log in")){
                window.location.reload();
                return false;
            }
            menu_report = JSON.parse(response.responseText);
            viewPage();
        },
        failure: function(response){
            viewPage();
        }
    });
}
function createMenu(menu, flag){
    let ans = menu.map((el)=>{
        let disabled = el.disabled === undefined ? false : el.disabled;
        let text = disabled ? '<span class="icon-lock"></span> ' + el.name: el.name;
        if(el.type === 'menu_item'){
            let config = {
                text: text,
                iconCls: el.iconCls || "",
                menu: createMenu(el.menus),
                //disabled: disabled
            };
            if(flag){ config.height = 40; }
            return config;
        } else if(el.type === 'report'){
            let config = {
                text: text,
                iconCls: el.iconCls || "",
                //disabled: disabled,
                handler: function(){
                    loadReport(el.idLink);
                }
            };
            if(flag){ config.height = 40; }
            return config;
        } else if(el.type === 'chart'){
            return {
                text: text,
                //disabled: disabled,
                handler: function(){
                    loadReport(el.idLink);
                }
            };
        }
    }) || [];
    return ans;
}
function loadChartData(panel, flag_modal){
    if(panel.params){
        Ext.Ajax.request({
            url: '/api/get_element_for',
            method: 'POST',
            jsonData: {
                id_shablon: panel.resource_id,
                params: panel.params,
                lang: "RUS"
            },
            success: function(response){
                if(response.responseText.includes("Log in")){
                    window.location.reload();
                    return false;
                }
                let data = JSON.parse(response.responseText);
                drawChart(panel, data, flag_modal);
            },
            failure: function(response){ }
        });
    } else if(panel.resource_id){
        Ext.Ajax.request({
            url: '/api/get_chart_for/' + panel.resource_id,
            method: 'GET',
            params: {  },
            success: function(response){
                if(response.responseText.includes("Log in")){
                    window.location.reload();
                    return false;
                }
                let data = JSON.parse(response.responseText);
                drawChart(panel, data, flag_modal);
            },
            failure: function(response){ }
        });
    }
}
function prepareData(data){
    let ans = [];
    if(data.typeChart === 'pie'){
        ans = [{
            name: ' ',
            colorByPoint: true,
            data: []
        }];
        for(let key of Object.keys(data.series)){
            ans[0].data.push({
                name: key,
                y: data.series[key].reduce((sum, current)=> sum + current[1], 0)
            });
        }
        ans[0].data.sort(function(a,b){return b.y-a.y;});
    } else {
        for (let key of Object.keys(data.series)) {
            let el_ans = {
                name: key,
                data: data.series[key].map((el)=>{
                    let tempDate=el[0].split('.');
                    return [Date.UTC(tempDate[2],tempDate[1]-1,tempDate[0]), el[1]];
                })
            };
            if(data.fill){
                el_ans.fillColor = {
                    linearGradient : [0, 0, 0, 300],
                    stops: [
                        [0, Highcharts.color(Highcharts.getOptions().colors[ans.length>11?11:ans.length]).setOpacity(1).get('rgba')],
                        [0.2, Highcharts.color(Highcharts.getOptions().colors[ans.length>11?11:ans.length]).setOpacity(0.3).get('rgba')],
                        [0.5, Highcharts.color(Highcharts.getOptions().colors[ans.length>11?11:ans.length]).setOpacity(0.1).get('rgba')],
                        [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                };
                el_ans.marker = {
                    fillColor: Highcharts.getOptions().colors[ans.length>11?11:ans.length],
                    radius: 2,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                };
                el_ans.lineWidth = 2;
                el_ans.type = "area";
            }
            ans.push(el_ans);
        }
    }
    return ans;
}
function drawChart(panel, data, flag_modal){
    switch(data.typeChart){
        case 'line':        drawLineChart(panel, data, flag_modal);    break;
        case 'bar':         drawBarChart(panel, data, flag_modal);     break;
        case 'pie':         drawPieChart(panel, data, flag_modal);     break;
        default:            drawLineChart(panel, data, flag_modal);    break;
    }
}
function drawLineChart(panel, data, flag_modal){
    let chart_id = "chart_" + panel.getItemId();
    let width = panel.getWidth();
    let height = panel.getHeight();
    height = (data.height || 200) - (flag_modal ? 28 : 0);
    panel.setHtml('<div id="'+chart_id+'"></div>');
    let chart_option = {
        chart: { type: 'line', width: width, height: height },
        accessibility: { enabled: false },
        title: { text: data.name, x: -20, margin: 50, style: { fontSize: '12px' } },
        subtitle: { style: { fontSize: '12px' } },
        xAxis: {
            type: 'datetime',
            title: { text: data.xAxisName, style: { fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        yAxis: {
            title: { text: data.yAxisName, style:{ fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        legend: legengSet(data.locationLegend || 'r'),
        series: prepareData(data)
    };
    if(data.fill){
        chart_option.tooltip = {shared: false};
        chart_option.plotOptions = {
            area: {
                lineWidth : 1,
                marker : {
                    enabled : false,
                    states : {
                        hover : {
                            enabled : true,
                            radius : 5
                        }
                    }
                },
                shadow : false,
                states : {
                    hover : {
                        lineWidth : 2
                    }
                }
            }
        };
    }
    $('#'+chart_id).highcharts(chart_option);
    if(flag_modal){
        let w = window_modal.getWidth();
        let h = window_modal.getHeight();
        window_modal.setSize(w, h - 1);
        window_modal.setSize(w, h);
    }
}
function drawBarChart(panel, data, flag_modal){
    let chart_id = "chart_" + panel.getItemId();
    let width = panel.getWidth();
    let height = panel.getHeight();
    height = (data.height || 200) - (flag_modal ? 28 : 0);
    panel.setHtml('<div id="'+chart_id+'"></div>');
    let chart_option = {
        chart: { type: 'column', width: width, height: height },
        accessibility: { enabled: false },
        title: { text: data.name, x: -20, margin: 50, style: { fontSize: '12px' } },
        subtitle: { style: { fontSize: '12px' } },
        xAxis: {
            type: 'datetime',
            title: { text: data.xAxisName, style: { fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        yAxis: {
            title: { text: data.yAxisName, style:{ fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        legend: legengSet(data.locationLegend || 'r'),
        series: prepareData(data)
    };
    $('#'+chart_id).highcharts(chart_option);
    if(flag_modal){
        let w = window_modal.getWidth();
        let h = window_modal.getHeight();
        window_modal.setSize(w, h - 1);
        window_modal.setSize(w, h);
    }
}
function drawPieChart(panel, data, flag_modal){
    let chart_id = "chart_" + panel.getItemId();
    let width = panel.getWidth();
    let height = panel.getHeight();
    height = (data.height || 200) - (flag_modal ? 28 : 0);
    panel.setHtml('<div id="'+chart_id+'"></div>');
    let chart_option = {
        chart: { type: 'pie', width: width, height: height },
        accessibility: { enabled: false },
        title: { text: data.name, x: -20, margin: 50, style: { fontSize: '12px' } },
        subtitle: { style: { fontSize: '12px' } },
        xAxis: {
            type: 'datetime',
            title: { text: data.xAxisName, style: { fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        yAxis: {
            title: { text: data.yAxisName, style:{ fontSize: '12px' } },
            labels: { style: { fontSize: '12px' } }
        },
        legend: legengSet(data.locationLegend || 'r'),
        series: prepareData(data),
        tooltip: {
            shared:false,
            headerFormat:'<span style="color:#ccc;font:12px ProximaNova, EikonFont, Arial, Helvetica, sans-serif;">{point.key}</span>',
            pointFormat: '{series.name}: {point.percentage:.1f}%'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.percentage:.2f} %',
                    style: { color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black', "fontSize": '12px', "fontWeight": "normal" },
                    //connectorWidth: 2,
                    distance: 30
                },
                showInLegend: true
            }
        }
    };
    $('#'+chart_id).highcharts(chart_option);
    if(flag_modal){
        let w = window_modal.getWidth();
        let h = window_modal.getHeight();
        window_modal.setSize(w, h - 1);
        window_modal.setSize(w, h);
    }
}

function legengSet(locationLegend){
    var legendOpt={};
    switch(locationLegend){
        case 'l': legendOpt={layout: 'vertical',align: 'left',verticalAlign: 'middle'}; break;
        case 'r': legendOpt={layout: 'vertical',align: 'right',verticalAlign: 'middle'}; break;
        case 't': legendOpt={layout: 'horizontal',align: 'center',verticalAlign: 'top'}; break;
        case 'b': legendOpt={layout: 'horizontal',align: 'center',verticalAlign: 'bottom'}; break;
        default: break;
    }
    return legendOpt;
}

function showTestWindow(header, body){
    let win = Ext.create('eikonWin', {
        title: header,
        height: 300,
        width: 500,
        html: body,
        items: [],
        //buttons: [{ text: vcbl[lang]["cancelBut"], handler: function() { win.close(); } }]
    }).show();
}
function loadExcel(panel, tool, e){
    let data = panel.getStore().getData().items;
    let columns = [];
    panel.getColumns().forEach((column)=>{
        if(column.text !== ""){
            columns.push(column.text);
        }
    });
    if(columns.length === 0){
        return;
    }

    let ans = [];
    ans.push(columns.join("\t"));
    data.forEach((el)=>{
        let row = [];
        Object.entries(el.data).forEach(
            ([key, value]) => {
                value = value || "";
                if(value !== el.id && !value.includes('param')){
                    row.push(value);
                }
            }
        );
        if(row.length > 0){
            ans.push(row.join("\t"));
        }
    });
    let win = Ext.create('eikonWin', {
        title: "Данные из таблицы: " + panel.title,
        bodyPadding: '13 10 10 10',
        height: 300,
        width: 700,
        buttons: [
            { text: "Скопировать в буфер", handler: ()=>{ selectText(); } },
            '->',
            { text: vcbl[lang]["cancelBut"], handler: function() { win.close(); } }
        ]
    });
    let pre_id = "pre_copy";
    let table = `<table><tr>${ans.map((el)=>{ return "<td>"+el.replaceAll("\t", "</td><td>")+"</td>"; }).join("</tr><tr>")}</tr></table>`;
    let html = `<pre style="overflow: auto; margin: 0;" id="${pre_id}">${table}</pre>`;
    win.setHtml(html);
    win.show();
    let pre_width = document.getElementById(pre_id).offsetWidth;
    pre_width = pre_width || 500;
    pre_width = pre_width > 1000 ? 1000 : pre_width;
    let pre_height = document.getElementById(pre_id).offsetHeight;
    pre_height = pre_height || 300;
    pre_height = pre_height > 650 ? 650 : pre_height;
    win.setSize(pre_width + 20, pre_height + 86);
    selectText(pre_id);
}
function selectText(nodeId){
    nodeId = nodeId || "pre_copy";
    let node = document.getElementById(nodeId);

    if (document.body.createTextRange) {
         const range = document.body.createTextRange();
         range.moveToElementText(node);
         range.select();
     } else if (window.getSelection) {
         const selection = window.getSelection();
         const range = document.createRange();
         range.selectNodeContents(node);
         selection.removeAllRanges();
         selection.addRange(range);
     } else {
        let err = "Could not select text in node: Unsupported browser."
        console.warn(err);
        Ext.toast({
            html: err, closable: false, align: 't', slideInDuration: 400, minWidth: 400
        });
     }

     copyToClipboard();
}
function copyToClipboard(){
    let ok = document.execCommand('copy');
    let html = "Данные скопированы в буфер обмена!";
    if(!ok){
        html = "Данные не скопированы в буфер обмена - Unsupported Browser!";
        console.warn(html);
    }
    Ext.toast({
        html: html, closable: false, align: 't', slideInDuration: 400, minWidth: 400
    });
    if(window.getSelection){
        window.getSelection().removeAllRanges();
    } else if(document.selection){
        document.selection.empty();
    }
}