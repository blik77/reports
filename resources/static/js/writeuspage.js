var start_validate = false;
$(document).ready(function() {
    $("#send_button").off('click').on('click', sendQuery);
});
function sendQuery(){
    if(!validateFields()){
        return false;
    }
    let data = {
        name: $("#name").val().trim(),
        email: $("#email").val().trim(),
        city: $("#city").val().trim(),
        job_role: $("#job_role").val().trim(),
        last_name: $("#last_name").val().trim(),
        phone: $("#phone").val().trim(),
        country: $("#country").val(),
        company: $("#company").val().trim(),
        extrainformation: $("#message").val().trim()
    };
    $.ajax({
        method: "POST",
        url: "api/newsUsers",
        data: data
    }).fail(function(data){
        alert("Произошла ошибка на сервере!");
    }).done(function(data){
        if(data.status){
            alert("Ваша заявка принята.\nВы получите отчет в ближайшую дату рассылки.\nОтчет публикуется 5 и 20 числа месяца.");
            window.location.reload();
        } else {
            alert(data.message);
        }
    });
}
function validateFields(){
    if(!start_validate){
        start_validate = true;
        $("#name, #email, #job_role, #last_name, #phone, #country, #company").on('input', validateFields);
    }
    let flag_validate = true;

    let name = $("#name").val().trim();
    if(name === "" || !(/^[A-zА-я]{1,20}$/igm.test(name))){
        $("#name + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#name + label").removeClass("error_visible");
    }

    let email = $("#email").val().trim();
    if(email === "" || !(/^[A-z0-9\.]*?@{1}[A-z0-9]*?\.{1}[A-z]{2,3}$/igm.test(email))){
        $("#email + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#email + label").removeClass("error_visible");
    }

    let job_role = $("#job_role").val().trim()
    if(job_role === "" || !(/^[A-zА-я]{1,50}$/igm.test(job_role))){
        $("#job_role + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#job_role + label").removeClass("error_visible");
    }

    let last_name = $("#last_name").val().trim()
    if(last_name === "" || !(/^[A-zА-я]{1,20}$/igm.test(last_name))){
        $("#last_name + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#last_name + label").removeClass("error_visible");
    }

    let phone = $("#phone").val().trim()
    if(phone === "" || !(/^[0-9]{1,20}$/igm.test(phone))){
        $("#phone + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#phone + label").removeClass("error_visible");
    }

    let country = $("#country").val().trim()
    if(country === "" || !(/^[A-zА-я]{1,20}$/igm.test(country))){
        $("#country + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#country + label").removeClass("error_visible");
    }

    let company = $("#company").val().trim()
    if(company === "" || !(/^[A-zА-я0-9]{1}[A-zА-я0-9 ]{1,50}$/igm.test(company))){
        $("#company + label").addClass("error_visible");
        flag_validate = false;
    } else {
        $("#company + label").removeClass("error_visible");
    }
    return flag_validate;
}
