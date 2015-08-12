$(document).ready(function () {

    function getOrderID(child){
        var tr_order = child.closest("tr.xc_order");

        if (tr_order.length != 1) {
            alert("Developer: Нет родителя для отмены заказа");
            return 0;
        }

        var oid = tr_order.attr("order_id");

        if (oid === undefined) {
            alert("Developer: Нет ID заказа");
            return 0;
        }
        return oid;
    }

    // отказа от заказа
    $(".xc_failure_order").click(function () {

        var oid = getOrderID( $(this) );

        if (confirm("Отменить заказ номер " + oid + " ?")) {
            $.ajax({
                type: 'POST',
                url: '/admin/order/failure/',
                data: {'oid': oid},
                dataType: 'json',
                success: function (result) {
                    if (result == 1) {
                        //alert('Заявка перемещена в отказ');
                        location.reload();
                    } else {
                        alert('Ошибка: Заявка НЕ перемещена в отказ!');
                    }
                },
                error: function () {
                    alert("Произошла ошибка ajax, сообщите о ней разработчикам.");
                }
            });
        }
    });

    $(".xc_close_order").click(function(){

        var oid = getOrderID( $(this) );

        $.ajax({
            type: 'POST',
            url: '/admin/order/close/',
            data: {'oid': oid},
            dataType: 'json',
            success:function(result){
                if(result == 1){
                    //alert('Заявка закрыта успешно!');
                    location.reload();
                }else{
                    alert('Ошибка: Заявка не закрыта!');
                }
            },
            error: function(){
                alert("Произошла ошибка, сообщите о ней разработчикам.");
            }
        });
    });

    // применение фильтра
    $(".xc_filter").change(function () {
        $("#form_filter_order").submit();
    });

    // Форма добавления
    var urlFormAdd = '/admin/order/order-add/';
    var modalFormAdd = $(".xc_order_add");
    var contentFormAdd = modalFormAdd.find(".xc_content");

    function show_form_add(json) {
        contentFormAdd.html(json.html).promise().done(function () {
            init_form_add(json);
            modalFormAdd.show();
        });
    }

    function hide_form_add() {
        modalFormAdd.hide();
        contentFormAdd.html('');
    }

    // закрытие формы по клику вне формы
    $(document).on('click', '.xc_order_add', function (event) {

        if ($(event.target).closest(".modal-content").length)
            return;
        if(confirm("Сохранить форму?")){
            $(".xc_order_add .xc_save").click();
        }else{
            hide_form_add();
        }

        event.stopPropagation();
    });

    $(document).on('click', '.xc_order_add .xc_close', function () {
        hide_form_add();
    });

    // инициализация формы после загрузки
    function init_form_add( json ) {

        //если редактирование формы
        if($("#orderaddform-order_id").val() != 0) {
            // изменить название формы
            $(".xc_title_edit_order").text("Изменить заказ");

            //скрыть лишние поля
            var hideFields = [
                "orderaddform-name",
                "orderaddform-surname",
                "orderaddform-phone",
                "orderaddform-email",
                "orderaddform-sex",
                //"orderaddform-regular",
                "orderaddform-fare"
            ];

            hideFields.forEach(function (item, i) {
                $('#' + item).closest('.row').hide();
                console.log(i);
            });
        }else{
            $(".xc_title_edit_order").text("Добавить заказ");
        }
        // маска для поля телефон
        $('#orderaddform-phone').mask("+7(999) 999-9999");

        // показ календаря
        $('#dp5_3').datepicker({
            language: "ru",
            format: "dd/mm/yyyy",
            startDate: new Date(),
            weekStart: 1
        }).on('changeDate', function (e) {
            $("#orderaddform-date").val($('#dp5_3').datepicker('getUTCDate').toISOString().split('T')[0]);
        });

        // дата редактируемого заказа
        if(json.date){
            var d = json.date.split('-');
            $('#dp5_3').datepicker('update', new Date(+d[0]-1, +d[2]-1, +d[2]));
        }

        // инициализация поля дата зависит от календаря
        $("#orderaddform-date").val($('#dp5_3').datepicker('getUTCDate').toISOString().split('T')[0]);// YYYY-MM-DD

        //при выборе города меняется тариф
        $('#orderaddform-city_tarif').on('change', function () {
            // установка тарифа в зависимсти от выбранного города
            var arr = $(this).val().split('_');
            if (arr[1] === undefined) {
                alert("Developer: формат Город_Тариф");
                return false;
            }
            $("#orderaddform-tarif").val(arr[1]);
        });
        // вызовем для установки уже выбранного города

        if($('#orderaddform-tarif').val() == 0){
            $('#orderaddform-city_tarif').change();
        }

        //----------------------- автозаполнение BEGIN

        //удаление клинера из списка выбранных
        $("#cleaner-lists").on('click', '.xc_remove', function () {
            var el = $(this).closest('div.cleaner-row');
            delete selectedCleaners[el.attr('clr_id')];
            el.remove();
            $('#cleaner-lists div.cleaner-row:first').find('input:radio').prop('checked',true);
        });

        // добавляем блок div содержащий вёрстку клинера в нужном месте
        function addRowDivCleaner( id, name, cleaner_main ){

            // отмечаем главного клинера
            var clList = $('#cleaner-lists');
            var checked = '';
            if (clList.find('div.cleaner-row').length == 0 || cleaner_main == id) {
                checked = 'checked';
            }

            var row = '<div clr_id="' + id + '" class="cleaner-row">' +
                '<input type="hidden" name="cleaners[]" value="' + id + '">' +
                '<input ' + checked + ' type="radio" name="cleaner_main" value="'+id+'" id="ir_' + id + '" />' +
                '<label for="ir_' + id + '">' + name + '</label>' +
                '<a class="close xc_remove">×</a>' +
                '</div>';

            $('#cleaner-lists').append(row);

            selectedCleaners[id] = 1;
        }

        // выбранные клинеры для уборки
        var selectedCleaners = {};
        if(json.cleaners.length != 0){
            json.cleaners.forEach(function(item, i) {
                addRowDivCleaner( item.id, item.name, json.cleaner_main );
            });
        }

        $('#add-cleaner').typeahead({
            //'items': 3,
            //'minLength': 2,
            'source': function (query, typeahead) { //encodeURIComponent(query)
                return $.get("/api/matchmaking/autocomplete/", {'subject_name': query}, function (data) {
                    names = [];
                    map = {};
                    $.each(data, function (i, v) {
                        if (!(v.id in selectedCleaners)) {
                            map[v.name] = v;
                            names.push(v.name);
                        }
                    });
                    return typeahead(names);
                });
            },

            updater: function (item) {

                addRowDivCleaner( map[item].id, map[item].name );

                setTimeout(function () {
                    $("#add-cleaner").val('');
                }, 300);

                return item;
            }
        }, 'json');
        //----------------------- автозаполнение END

    }

    // загрузка формы добавления
    $(document).on('click', ".xc_show_order_add", function () {
        // если есть order_id то редактирование
        var order_id = $(this).attr('order_id') == undefined ? 0 : $(this).attr('order_id');

        //загрузка формы через ajax
        $.ajax({
            type: 'POST',
            url: urlFormAdd,
            dataType: 'json',
            data:{
                'order_id': order_id
            },
            success: function (json) {
                show_form_add(json);
            },
            error: function () {
                alert("Error: загрузка формы добавления через ajax  ");
            }
        });
    });

    // save add form
    $(document).on('click', ".xc_order_add .xc_save", function () {
        $.ajax({
            type: 'POST',
            url: urlFormAdd,
            data: $('#form-order-add').serialize(),
            dataType: 'json',
            success: function (json) {
                if (json.result == 'ok') {
                    /*if(confirm('Заказ принят! \n Обновить страницу?')){
                        location.reload();
                    }*/
                    location.reload();
                    hide_form_add();
                } else {
                    show_form_add(json);
                }
            },
            error: function () {
                alert("Error: загрузка формы добавления через ajax  ");
            }
        });
    });


});