var mainPanel;
Ext.onReady(function(){ viewPage(); });
function viewPage(){
    Ext.tip.QuickTipManager.init();
    let filter_text = Ext.create('Ext.form.field.Text', {
        width: 135,
        listeners: {
            'change': function(datefield, nv, ov){
                mainPanel.filterNews();
            }
        }
    });
    let filter_date = Ext.create('Ext.form.field.Date', {
        maxValue: new Date(),
        value: new Date(new Date().setDate(new Date().getDate() - 30)),
        width: 135,
        listeners: {
            'change': function(datefield, nv, ov){
                mainPanel.filterNews();
            }
        }
    });
    let only_my = Ext.create('Ext.form.field.Checkbox', {
        boxLabel: 'Показать все',
        handler: function(checkbox, checked) {
            getNews(!checked);
        }
    })
    let newsPanel = Ext.create('Ext.grid.Panel', {
        title: 'Новости',
        tbar: [Ext.create('Ext.Button', {
            text: 'Создать',
            iconCls: 'add_but',
            tooltip: 'Создать новость',
            style: {
                borderColor: 'red',
                borderStyle: 'solid'
            },
            handler: function() {
                createNews(0, "Новая новость", "Новая новость");
            }
        }), '-', filter_text, '-', filter_date, '-', admin?only_my:''],
        region: 'west',
        width: 500,
        hideHeaders: true,
        collapsible: true,
        split: true,
        store: Ext.create('Ext.data.Store', {
            fields:[ 'id', 'header_news', 'date_news_string']
        }),
        columns: [
            {
                xtype: 'actioncolumn',
                width: 25,
                menuDisabled: true,
                sortable: false,
                items: [{
                    getClass: function(value, metadata, record, row, col, store){
                        return record.get('checked') ? 'mini_green_icon' : 'mini_red_icon';
                    },
                    getTip: function(value, metadata, record, row, col, store){
                        if(admin){
                            return record.get('checked') ? 'Снять с публикации' : 'Опубликовать';
                        } else {
                            return record.get('checked') ? 'Опубликовано' : 'Не опубликовано';
                        }
                    },
                    handler: function(grid, rowIndex, colIndex) {
                        if(!admin){
                            return false;
                        }
                        let rec = grid.getStore().getAt(rowIndex);
                        Ext.Msg.show({
                            title: 'Изменение статуса публикации',
                            message: `Вы действительно хотите ${rec.get('checked')?'снять с публикации':'опубликовать'} новость "${rec.get('header_news')}"?`,
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.Msg.QUESTION,
                            fn: function(btn) {
                                if (btn === 'yes') {
                                    publicateNews(rec);
                                } else if (btn === 'no') { }
                            }
                        });
                    }
                }]
            },
            { text: 'Название', dataIndex: 'header_news', flex: 1 },
            { text: 'Дата', dataIndex: 'date_news_string', width: 115 },
            {
                xtype: 'actioncolumn',
                width: 25,
                menuDisabled: true,
                sortable: false,
                items: [{
                    iconCls: 'delete_but',
                    tooltip: 'Удалить',
                    handler: function(grid, rowIndex, colIndex) {
                        let rec = grid.getStore().getAt(rowIndex);
                        Ext.Msg.show({
                            title:'Удаление',
                            message: `Вы действительно хотите удалить ноаость "${rec.get('header_news')}"?`,
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.Msg.QUESTION,
                            fn: function(btn) {
                                if (btn === 'yes') {
                                    mainPanel.deleteNews(rec);
                                } else if (btn === 'no') { }
                            }
                        });
                    }
                }]
            }
        ],
        listeners: {
            'rowclick': function(view, rec){
                mainPanel.selectNews(rec);
            }
        }
    });
    let news_name = Ext.create('Ext.form.field.Text', {
        name: 'name',
        fieldLabel: 'Название',
        allowBlank: false,
        width: '100%'
    });
    let news_content = Ext.create('Ext.Panel', {
         title: '',
         border: false,
         flex: 1,
         html: `<textarea id="news_content"></textarea>`
    });
    let save_news_button = Ext.create('Ext.Button', {
        text: 'Сохранить',
        iconCls: 'save_but',
        disabled: true,
        style: {
            borderColor: 'red',
            borderStyle: 'solid'
        },
        handler: function() {
            createNews(mainPanel.getSelectedNews()[0].get('id'), news_name.getValue(), tinymce.get('news_content').getContent());
        }
    });
    let editorPanel = Ext.create('Ext.Panel', {
        title: 'Редактор новостей',
        tbar: [save_news_button],
        region: 'center',
        bodyPadding: 10,
        flex: 1,
        border: false,
        items: [news_name, news_content]
    });
    let add_tag_button = Ext.create('Ext.Button', {
        text: 'Изменить теги для новости',
        iconCls: 'set_but',
        disabled: true,
        style: {
            borderColor: 'red',
            borderStyle: 'solid'
        },
        handler: getTags
    });
    let tagsPanel = Ext.create('Ext.tree.Panel', {
        title: 'Тэги',
        rootVisible: false,
        useArrows: true,
        border: false,
        region: 'east',
        width: 300,
        hideHeaders: true,
        collapsible: true,
        split: true,
        viewConfig: {
            stripeRows: true,
            enableTextSelection: false,
            markDirty: false
        },
        store: Ext.create('Ext.data.TreeStore', {
            fields: ['text']
        }),
        columns: {
            items: [{
                xtype: 'treecolumn',
                flex: 1,
                dataIndex: 'text'
            }],
            defaults: {
                menuDisabled: true,
                sortable: false,
                resizable: false
            }
        },
        tbar: [add_tag_button]
    });
    mainPanel = Ext.create('Ext.Panel', {
        title: '',
        layout: 'border',
        border: false,
        items: [newsPanel, editorPanel, tagsPanel],
        scrollable: true,
        newsPanel: newsPanel,
        loadNews: function(data){
            newsPanel.getStore().loadData(data);
            this.filterNews();
            if(this.getSelectedNews().length > 0){
                let tags = array_to_tree(this.getSelectedNews()[0].get('tags'));
                this.loadTags(tags);
            }
        },
        filterNews: function(){
            newsPanel.getStore().clearFilter();
            let text = filter_text.getValue().trim();
            let date = filter_date.getValue();
            if(text !== '' || date !== ''){
                date = Ext.Date.format(filter_date.getValue(), 'U') * 1000;
                newsPanel.getStore().filterBy(function(rec){
                    let flag = true;
                    if(text !== ''){
                        if(!rec.get('header_news').toLowerCase().includes(text.toLowerCase())){
                            flag = false;
                        }
                    }
                    if(date > 0){
                        if(rec.get('date_news_timestamp') < date){
                            flag = false;
                        }
                    }
                    return flag;
                });
            } else {
                newsPanel.getStore().clearFilter();
            }
        },
        getSelectedNews: function(){
            return newsPanel.getSelection();
        },
        selectNews: function(rec){
            news_name.setValue(rec.get('header_news'));
            tinymce.get('news_content').setContent(rec.get('body_news'));
            this.loadTags(array_to_tree(rec.get('tags')));
            save_news_button.enable();
            add_tag_button.enable();
        },
        loadTags: function(data){
            tagsPanel.setRootNode({
                text: 'Root',
                expanded: true,
                children: data
            });
        },
        getSelectedNewsTags: function(){
            return tagsPanel.getStore().getRange().map(el=>el.get('id'));
        },
        deleteNews: function(rec){
            deleteNews(rec.get('id'));
            if(this.getSelectedNews()[0].get('id') === rec.get('id')){
                news_name.setValue("");
                tinymce.get('news_content').setContent("");
                save_news_button.disable();
                add_tag_button.disable();
            }
        }
    });
    Ext.create('Ext.container.Viewport', {
        border: false,
        layout: 'fit',
        items: [mainPanel]
    });
    initHtmlEditor();
    
    getNews();
}

function initHtmlEditor(){
    tinymce.init({
        selector: '#news_content',
        width: '100%',
        language: 'ru',
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
        editimage_cors_hosts: ['picsum.photos'],
        menubar: 'file edit view insert format tools table help',
        toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
        //toolbar_sticky: true,
        //toolbar_sticky_offset: window.matchMedia('(max-width: 1023.5px)').matches ? 102 : 108,
        autosave_ask_before_unload: true,
        autosave_interval: '30s',
        autosave_prefix: '{path}{query}-{id}-',
        autosave_restore_when_empty: false,
        autosave_retention: '2m',
        image_advtab: true,
        link_list: [
            { title: 'My page 1', value: 'https://www.tiny.cloud' },
            { title: 'My page 2', value: 'http://www.moxiecode.com' }
        ],
        image_list: [
            { title: 'My page 1', value: 'https://www.tiny.cloud' },
            { title: 'My page 2', value: 'http://www.moxiecode.com' }
        ],
        image_class_list: [
            { title: 'None', value: '' },
            { title: 'Some class', value: 'class-name' }
        ],
        importcss_append: true,
        file_picker_callback: (callback, value, meta) => {
            /* Provide file and text for the link dialog */
            if (meta.filetype === 'file') {
              callback('https://www.google.com/logos/google.jpg', { text: 'My text' });
            }

            /* Provide image and alt text for the image dialog */
            if (meta.filetype === 'image') {
              callback('https://www.google.com/logos/google.jpg', { alt: 'My alt text' });
            }

            /* Provide alternative source and posted for the media dialog */
            if (meta.filetype === 'media') {
              callback('movie.mp4', { source2: 'alt.ogg', poster: 'https://www.google.com/logos/google.jpg' });
            }
        },
        templates: [
            { title: 'New Table', description: 'creates a new table', content: '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>' },
            { title: 'Starting my story', description: 'A cure for writers block', content: 'Once upon a time...' },
            { title: 'New list with dates', description: 'New List with dates', content: '<div class="mceTmpl"><span class="cdate">cdate</span><br><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>' }
        ],
        template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
        template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
        image_caption: true,
        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
        noneditable_class: 'mceNonEditable',
        toolbar_mode: 'sliding',
        contextmenu: 'link image table',
        skin: 'oxide',
        content_css: 'default',
        content_style: 'body { font-family: "ProximaNova","KortesFont",tahoma,arial,verdana,sans-serif; font-size: 13px; background: none repeat scroll 0 0 #1a1a1c; color: #c2c2c2; }'
    });
}

function getNews(only_my){
    if(only_my === undefined){
        only_my = true;
    }
    mainPanel.newsPanel.setLoading(true);
    Ext.Ajax.request({
        url: '/api/news/' + only_my,
        method: 'GET',
        success: function(response){
            let data = JSON.parse(response.responseText);
            data.forEach((el)=>{
                el.date_news_timestamp = Date.parse(el.date_news);
                el.date_news_string = new Date(el.date_news_timestamp).toLocaleString("ru").replace(",", "");
            });
            data.sort((a, b)=>{
                if(a.date_news_timestamp > b.date_news_timestamp){
                    return -1;
                } else if(a.date_news_timestamp < b.date_news_timestamp){
                     return 1;
                } else {
                    return 0;
                }
            });
            mainPanel.loadNews(data);
            mainPanel.newsPanel.setLoading(false);
        },
        failure: function(response){ }
    });
}

function parseTags(tags, tags_checked){
    let ans = [];
    tags.forEach((tag)=>{
        let tag_el = {
            id: tag.id,
            name: tag.name,
            text: `${tag.name} (${tag.fullname || ''})`
        };
        if(tags_checked){
            tag_el.checked = false;
            if(tags_checked.includes(tag.id)){
                tag_el.checked = true;
            }
        }
        if(tag.tags && tag.tags.length > 0){
            tag_el.expanded = true;
            tag_el.children = parseTags(tag.tags, tags_checked);
        } else {
            tag_el.leaf =  true;
        }
        ans.push(tag_el);
    });
    return ans;
}
function array_to_tree(array, parent){
    let tree = [], temp_array = [];
    parent = typeof parent !== 'undefined' ? parent : { id: 0 };
    if(parent.id === 0){
        array.forEach((el)=>{
            if(array.find(ar_el=>ar_el.id === el.owner) === undefined){
                el.owner = 0;
            }
            el.text = el.name;
            temp_array.push({id: el.id, text: el.name, owner: el.owner});
        });
        array = temp_array;
    }
    let children = array.filter(function(child){ return child.owner === parent.id; });
    
    if(children.length > 0){
        if(parent.id === 0){
           tree = children;   
        } else {
           parent.children = children;
        }
        parent.expanded = true;
        children.forEach((el)=>{
            array_to_tree(array, el);
        });                    
    } else {
        parent.leaf = true;
    }
    return tree;
}

function getTags(){
    Ext.Ajax.request({
        url: '/api/get_tags',
        method: 'GET',
        success: function(response){
            let data = JSON.parse(response.responseText);
            showAddTags(data.filter(el=>el.owner === null));
        },
        failure: function(response){ }
    });
}
function showAddTags(data){
    let addTagsPanel = Ext.create('Ext.tree.Panel', {
        rootVisible: false,
        useArrows: true,
        border: false,
        viewConfig: {
            stripeRows: true,
            enableTextSelection: false,
            markDirty: false
        },
        hideHeaders: true,
        checkPropagation: 'both',
        store: Ext.create('Ext.data.TreeStore', { }),
        listeners: {
            'rowclick': function(view, rec){ }
        }
    });
    let add_tag_button = Ext.create('Ext.Button', {
        text: 'Добавить',
        iconCls: 'save_but',
        //disabled: true,
        style: {
            borderColor: 'red',
            borderStyle: 'solid'
        },
        handler: function(){
            let tags = addTagsPanel.getView().getChecked();
            addTags(tags.map(el=>el.get('name')));
        }
    });
    Ext.create('Ext.window.Window', {
        title: 'Тэги',
        height: 750,
        width: 500,
        layout: 'fit',
        modal:true,
        items: [addTagsPanel],
        buttons: [add_tag_button]
    }).show();
    addTagsPanel.setRootNode({
        text: 'Root',
        expanded: true,
        children: parseTags(data, mainPanel.getSelectedNewsTags())
    });
}
function addTags(tags){
    Ext.Ajax.request({
        url: `/api/news/${mainPanel.getSelectedNews()[0].get('id')}/add_tags`,
        method: 'POST',
        jsonData: JSON.stringify(tags),
        success: function(response){
            let data = JSON.parse(response.responseText);
            getNews();
        },
        failure: function(response){ }
    });
}
function deleteNews(id){
    Ext.Ajax.request({
        url: `/api/news/${id}`,
        method: 'DELETE',
        success: function(response){
            getNews();
        },
        failure: function(response){ }
    });
}
function publicateNews(rec){
    Ext.Ajax.request({
        url: `/api/news/${rec.get('id')}/${!rec.get('checked')?'checked':'unchecked'}`,
        method: 'POST',
        success: function(response){
            rec.set('checked', !rec.get('checked'));
        },
        failure: function(response){ }
    });
}
function createNews(id, header_news, body_news){
    Ext.Ajax.request({
        url: `/api/news`,
        method: 'POST',
        params: {
            id: id,
            header_news: header_news,
            body_news: body_news
        },
        success: function(response){
            getNews();
        },
        failure: function(response){ }
    });
}
