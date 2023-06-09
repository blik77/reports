Ext.define('eikonWin', {
    extend: 'Ext.window.Window',
    xtype: 'eikonWin',
    cls: 'winMod',
    layout: {type: 'vbox',pack: 'start',align: 'stretch'},
    //bodyPadding: '13 10 10 10',
    header: {height: 28 ,cls: 'headerWinMod'},
    border: false,
    ghost: false,
    modal: true
 });