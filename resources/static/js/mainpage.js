$(document).ready(function() {
    $("#enter_system").off('click').on('click', ()=>{
        window.location.href = "/reportpage";
    });
    $("#get_access").off('click').on('click', ()=>{
        window.location.href = "/writeuspage";
    });
});