$(document).ready(function() {
    $("#submit_registration").off('click').on("click", ()=>{
        if(checkButton()){
            $("#form_registration").submit();
        }
    });
});

function checkButton(){
    let form = document.querySelectorAll('form')[0];
    let flag = form.checkValidity();
    form.classList.add('was-validated');
    return flag;
}