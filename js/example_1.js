/*--------- услуги на страницы оформления заказа ----*/
$(document).ready(function () {
    $('.dop-box').click(function () {
        $('.icondop').toggleClass('icondopAnim');
        $('.dop-box-index').toggleClass('dop-box-indexAnim');
    });
});

// текущий шаг оплаты
var current_order_step = 1;
var o_valid = 0;
var promo = 0;
//Продолжительность уборки
//рекомендуемое время по калькулятору
var recommend_hours = 0;
// время выбранное пользователем
var select_user_hours = 0;

$(document).ready(function () {

    /*------ изменение значения в формах --********/
    var time_work_input = $('#time_work');

    //Стоимость часа работы в рубях нал/безнал
    var cost_one = $("#cost_one").val();
    var cost_multi = $("#cost_multi").val();

    if($("#table_pay").length) {
        var TABLE_PAY = JSON.parse($("#table_pay").val());
    }

    function getCostHourWork() {
        /*
         var res = 0;
         if( $("input[name=regular_cleaning]").length == 0 )
         return 0;

         if ($("input[name=regular_cleaning]:checked").val() == 0) {
         // наличные
         res = cost_one;
         } else if ($("input[name=regular_cleaning]:checked").val() == 1) {
         //безналичные
         res = cost_multi;
         } else {
         alert('function getCostHourWork - error!!!');
         }
         return res;
         */

        return cost_one;
    }

    $("#select_user_hours").change(function(){
        select_user_hours = $(this).val();

        if(select_user_hours < long_time){
            $('#message-min-time').show();
            $('#textarea-min-time').show();
        }else{
            $('#message-min-time').hide();
            $('#textarea-min-time').hide();
        }

        reload_sum_cart();

        // скидываем пользовательские часы, чтобы если изменятся параметры пересчитать сумму уже с ними
        select_user_hours = 0;
    });

// рабочие часы
    function getHourWork(cnt_bathrooms, cnt_rooms) {

        cnt_bathrooms = cnt_bathrooms > 4 ? 3 : cnt_bathrooms - 1;
        cnt_rooms = cnt_rooms > 5 ? 4 : cnt_rooms - 1;

        return TABLE_PAY[cnt_rooms][cnt_bathrooms];
    }

    function reload_sum_cart() {
        if ($("#cnt_bathrooms").length > 0) {
            // доп услуги
            var serv_long_time = 0;
            var sum_serv = 0;
            $("input.xc_chbox_serv:checked").each(function (i) {
                serv_long_time += parseInt($(this).attr('long_time'));
                sum_serv += parseInt($(this).attr('price'));
            });
            serv_long_time = serv_long_time / 60;

            //Продолжительность уборки
            //рекомендуемое время по калькулятору
            long_time = getHourWork($("#cnt_bathrooms").val(), $("#cnt_rooms").val()) + serv_long_time;
            recommend_hours = long_time;
            //вывод итогового времени
            $("#recommend_hours").text(recommend_hours);

            if(select_user_hours == 0){
                $("select#select_user_hours option[value='"+ long_time + "']").prop('selected', true);
                $("#xc_time_cliens").text(long_time);
                $('#message-min-time').hide();
                $('#textarea-min-time').hide();

                $("#user_tasks").val('');
                $("#h_recommend_hours").val(0);
            }else{
                long_time = select_user_hours;
                $("#xc_time_cliens").text(select_user_hours);

                $("#h_recommend_hours").val(recommend_hours);
            }

            $("#bay_twork").html(long_time);
            $("#time_pri").html(long_time);

            //стоимость
            var sum_full = long_time * getCostHourWork() + sum_serv;
            var sum_itog =  sum_full - promo;

            // учитывая бонусы
            var bonus_all = $("#user_bonus").val();
            if(bonus_all >0) {
                if (bonus_all >= sum_itog) {
                    bonus = sum_itog;
                    sum_itog = 0;
                } else {
                    bonus = bonus_all;
                    sum_itog -= bonus;
                }

                $("#xc_used_bonus").html(bonus);
            }

            //показ полной суммы
            $("#sum_full").html(sum_full);
            if(sum_full == sum_itog){
                $(".st-bay").hide();
            }else{
                $(".st-bay").show();
            }


            $("#sum_cart").html(sum_itog);
            $("#sum_payment").val(sum_itog);

            $("#sum_online").html(sum_itog);
            $("#sum_nal").html(sum_itog);
        }
    }

    $('.order5').toggleClass('order_active');

    function services_click( el ){

        var serv_id = el.attr("servid");

        el.toggleClass('order_active');
        $('.xc-sas-'+serv_id).toggleClass('xc_none');

        if (el.hasClass('order_active')) {
            el.find("input.xc_chbox_serv").prop('checked', true);
        } else {
            el.find("input.xc_chbox_serv").prop('checked', false);
        }

        // отображение в блоке - итог
        var cnt_li_serv = $('.xc_text_uslugi div.nam_chek').length-1;
        var cnt_li_serv_none =  $('.xc_text_uslugi div.xc_none').length;

        if( cnt_li_serv == cnt_li_serv_none ){
            $(".xc-sas-noselect").show();
        }else{
            $(".xc-sas-noselect").hide();
        }

        reload_sum_cart();
    }

    $('.xc-unit').click(function () {
        services_click( $(this) );
    });

    $(".xc_reg_serv").change(function () {
        reload_sum_cart();
    });

    $(".xc_regular_cleaning").change(function () {
        reload_sum_cart();
    });

    $(".checkbox-box2 input:checkbox").change(function () {
        reload_sum_cart();
    });

    time_work_input.change(function () {
        reload_sum_cart();
    });

    $('#plus').click(function () {
        var this_val = parseFloat(time_work_input.val());
        if (isNaN(this_val)) {
            this_val = 2;
        } else {
            this_val += 0.5;
        }
        time_work_input.val(this_val).removeClass('error');

        reload_sum_cart();

        //time_work_input.focus();
        //$(this).focus();
    });

    $('#minus').click(function () {
        var currentVal = parseFloat(time_work_input.val());
        if (currentVal > 2)
            time_work_input.val(currentVal - 0.5).removeClass('error'); // Здесь ставим нужное значение меньше которого нельзя
        else
            time_work_input.val('Меньше 2 нельзя!').addClass('error');

        reload_sum_cart();

        //time_work_input.focus();
        //$(this).focus();
    });

    var time_end_input = $('.time-end');
    var h_time_end = $('#time_end');
    $('#plus2').click(function () {
        var this_val = parseInt(time_end_input.val());
        if (isNaN(this_val)) {
            this_val = 5;
        } else if (this_val < 10) {
            this_val++;
        }
        h_time_end.val(this_val);
        time_end_input.val(this_val).removeClass('error');

        reload_sum_cart();
    });

    $('#minus2').click(function () {
        var currentVal = parseInt(time_end_input.val());
        if (isNaN(currentVal))
            currentVal = time_end_input.hasClass('error') ? 2 : 4;

        if (currentVal > 1) {
            h_time_end.val(currentVal - 1);
            time_end_input.val(currentVal - 1).removeClass('error'); // Здесь ставим нужное значение меньше которого нельзя
        }
        else
            time_end_input.val('Меньше нельзя!').addClass('error');

        reload_sum_cart();
    });

    reload_sum_cart();

    function scrollToElement( el, pxY ){
        pxY = typeof pxY !== 'undefined' ? pxY : 0;

        $('html, body').animate({scrollTop: el.offset().top + pxY}, 500);
    }

    $(".xc_btn_next").click(function () {
        switch (current_order_step) {
            case 1:

                if($("#date_cleaning").val() == ''){
                    $("#date_cleaning").addClass('error');
                    $("#date_cleaning_error_my").show();

                    // прокрутка к ошибке
                    var el = $(".xc_label_date_cleaning");
                    scrollToElement( el, -70 );
                    return false;
                }else{
                    $("#date_cleaning").removeClass('error');
                    $("#date_cleaning_error_my").hide();
                }

                var timeReg = /^([0-1][0-9]|[2][0-3])(:([0-5][0-9])){1,2}$/i;
                timeReg.test($('#date_cleaning_time').val());
                if( !timeReg.test($('#date_cleaning_time').val()) ){
                    $("#date_cleaning_time").addClass('error');
                    $("#date_cleaning_time_error_my").show();

                    // прокрутка к ошибке
                    var el = $(".xc_label_date_cleaning_time");
                    scrollToElement( el, -70 );
                    return false;
                }else{
                    $("#date_cleaning_time").removeClass('error');
                    $("#date_cleaning_time_error_my").hide();
                }

                scrollToElement( $('html, body'), 0 );

                current_order_step = 2;

                document.title = 'uLime Оформление заказа (шаг 2)';

                $(".xc_step_1").hide();
                $(".xc_step_2").show();

                $(".xc_btn_next").hide();
                $(".xc_btn_payment").show();

                $(".xc_back").show();

                $(".xc_step_number").html(current_order_step);
                $(".xc_title_page").html("Заполните контактные данные");
                break;
        }

        //reload_sum_cart();
    });

    $(".xc_back").click(function () {
        switch (current_order_step) {
            case 2:
                // 2->1
                current_order_step = 1;

                document.title = 'uLime Рассчитать стоимость (шаг 1)';

                $(".xc_step_2").hide();
                $(".xc_step_1").show();

                $(".xc_btn_payment").hide();
                $(".xc_btn_next").show();

                $(".xc_back").hide();

                break;
            case 3:
                // 3->2
                document.title = 'uLime Оформление заказа (шаг 2)';

                $(".xc_steps_order_2").removeClass('steps-ok');
                $(".xc_steps_line_2").addClass("ord-l");

                $(".xc_step_3").hide();

                current_order_step = 2;
                $(".xc_step_2").show();

                $(".xc_btn_next").show();
                $(".xc_btn_payment").hide();
                break;
        }

        $(".xc_step_number").html(current_order_step);
        $(".xc_title_page").html("Онлайн калькулятор");
    });

    $(".xc_btn_payment").click(function () {

        if (o_valid.element("#first_name") &&
            o_valid.element("#user_phone") &&
            o_valid.element("#email") &&
            o_valid.element("#street") &&
            o_valid.element("#apartment")) {
            $("#form_order").submit();
        }
    });

    $("#promo_code").blur(function () {
        if( $("#promo_code").val() != '' ){
            var param = {
                promo_code: $("#promo_code").val()
            };

            $.ajax({
                type: 'POST',
                url: '/order/use-promo/',
                data: param,
                dataType: 'json',
                success: function (result) {
                    if (result != 0) {
                        $("#promo_yes").show();
                        setTimeout(function(){
                            $("#promo_yes").hide("slow");
                        }, 5000);

                        $("#promo_no").hide();
                        $('.hidden_code').val( param.promo_code );
                        promo = result;
                        reload_sum_cart();
                    } else {
                        $("#promo_yes").hide();
                        $("#promo_no").show();
                        setTimeout(function(){
                            $("#promo_no").hide("slow");
                        }, 5000);
                        promo = 0;
                        reload_sum_cart();
                    }
                },
                error: function () {
                    alert("Произошла ошибка, сообщите о ней разработчикам.");
                }
            });
        }
    });

    var nowDT = new Date();
    var minDate = nowDT.getDate() + '.' + (nowDT.getMonth() + 1) + '.' + nowDT.getFullYear();
    var minTime = nowDT.getHours() + ':' + nowDT.getMinutes();

    if($('#date_cleaning').length > 0) {

        $('#date_cleaning')
            .datepicker({
                //showOn: 'both',
                inline: true,
                regional: "ru",
                firstDay: 1,
                dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
                dateFormat: 'dd.mm.yy',
                minDate: nowDT,
                maxDate: '+1Y'
            })
            .change(function () {
                $("#clean_date").html($(this).val());
                $("#date_cleaning").removeClass('error');
                $("#date_cleaning_error_my").hide();
            });

        $('#date_cleaning_time').on('change', function() {
            $("#clean_time").html($(this).val());
        });
    }

    if ($("#form_order").length != 0) {
        /*---валидация данных---*/
        o_valid = $("#form_order").validate({
            ignore: '.ignore',
            errorElement: 'div',
            focusCleanup: false,

            showErrors: function(event, validator) {
                // прокрутка к элементу
                if(validator[0] != undefined) {
                    scrollToElement( $(".xc_label_"+validator[0].element.id), -70 );
                }
                this.defaultShowErrors();
            },

            rules: {
                date_cleaning: {
                    required: true
                    //,customFormatDate : true
                },
                date_cleaning_time: {
                    required: true
                },
                email: {
                    required: true,
                    email: true
                },
                user_phone: {
                    required: true,
                    minlength: 14
                },
                first_name: {
                    required: true
                },
                street: {
                    required: true
                },
                apartment: {
                    required: true
                }
            },

            messages: {
                date_cleaning: {
                    required: "Заполните поле"
                },
                date_cleaning_time: {
                    required: "Заполните поле"
                },
                email: {
                    required: "Заполните поле",
                    email: 'Неправильный формат email'
                },
                user_phone: {
                    required: "Заполните поле",
                    minlength: "Телефон введён неверно"
                },
                first_name: {
                    required: "Заполните поле"
                },
                street: {
                    required: "Заполните поле"
                },
                apartment: {
                    required: "Заполните поле"
                }
            }
        });

        $('#user_phone').mask("999-999-99-99");
    }
    //---------------------------------------------
    $(".bo-box-plus").click(function () {
        //2 туалета может буть только у 3 комнатной и больше

        var $input = $(this).closest("div.xc_cnt_bo").find("input.xc_sthet");

        if ($input.attr('id') == 'cnt_rooms' && parseInt($input.val()) < 5) {
            $input.val(parseInt($input.val()) + 1);
        } else if ($input.attr('id') == 'cnt_bathrooms' && parseInt($input.val()) < 4 && $input.val() <= $('#cnt_rooms').val() )
        {
            if( $('#cnt_rooms').val() >= 3 && parseInt($input.val())+1 <= parseInt($('#cnt_rooms').val())-1 ){
                $input.val(parseInt($input.val()) + 1);
            }else if($('#cnt_rooms').val() < 3){
                $input.val(1);
            }
        }

        reload_sum_cart();
    });

    $(".bo-box-minus").click(function () {
        var $input = $(this).closest("div.xc_cnt_bo").find("input.xc_sthet");

        if (parseInt($input.val()) != 1) {
            $input.val(parseInt($input.val()) - 1);
        }

        if($input.attr('id') == 'cnt_rooms'){
            $('#cnt_bathrooms').val( 1 );
        }

        reload_sum_cart();
    });

    // смена способа оплаты

    function change_method_payment(){
        switch ($("#method_payment").val()) {
            case '1':
                $("#form_order").attr('action', '/order/nalichnye/');
                break;
            case '2':
                $("#form_order").attr('action', '/order/online/');
                break;
        }
    }

    change_method_payment();

    $(".xc_btn_cash").click(function(){
        // наличными
        $('#method_payment').val(1);

        $('.xc_btn_cash').addClass('btn-active');
        $('.xc_btn_online').removeClass('btn-active');

        change_method_payment();
    });

    $(".xc_btn_online").click(function(){
        // онлайн
        $('#method_payment').val(2);

        $('.xc_btn_online').addClass('btn-active');
        $('.xc_btn_cash').removeClass('btn-active');

        change_method_payment()
    });

    $(".xc_step_2").hide();
});
