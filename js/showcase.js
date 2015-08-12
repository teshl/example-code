nLoadPage = 0;
nPrevPage = 0;
nCurPage  = 0;
nLastPage = 0;
nCurFolderId = 0;

oTReq       = false;
oPredicted  = false;
aPagesCache = [];

chLookReload = false;
 
$(document).ready(function() {

    sPageUrl = '/'+LANG_ID+'/showcase/';

    nCurFolderId = 0;
    sFoldersMode = 'move';

    oFolderTpl  = $('#fold_cont .folder_item:first');
    oCurTinyDlg = false;
    bNeedUpdate = false; // Требуется обновление всего содержимого
    oScrollApi  = false;
    
    function clear_url(search)
    {
        res='';
        if ( SC_SUBDOMAIN )
        {
            res = search.replace(/^(\/.{2})?\/showcase\//, '/');
        }
        else
        {
            search = search.replace(/^(\/.{2})?\/showcase\//, '/');
            res = search.replace( '/'+SHOWCASE_ID, '');
        }
        
        return res;
    }

    function show_items( dt )
    {
        
        if ( typeof dt.isLookClose != "undefined"){
            isLookClose = dt.isLookClose;
        }
        
        $('.fav_menu').css('visibility','');        
        if (dt.menu_sc_hide){
            $('.fav_menu').css('visibility','hidden');
        }
        
    	bUserCanManage = dt.bUserCanManage*1;
    	
    	if ( !dt.is_folder_list ){
    	    $("#filter_up_list").show();
    	    
    	    $("#ch_folder_prod_list_wrapper").removeClass("ch_act");
            $("#ch_folder_prod_list").prop("checked", false);
    	}
    	
    	//alert( 'ajax_item_' + bUserCanManage);
    	
    	if( bUserCanManage )
    	{
    		$('.fav_menu').show();
    	}
    	else	
        {
    		$('.fav_menu').hide();
    	}

        $('#cats_list').html( dt.cats ).show();

        if ( dt.pg.length > 0 )
        {
            $('#top_paginator').html( dt.pg ).show();
            $('#bottom_paginator').html( dt.pg ).show();
        }
        else
        {
            $('#top_paginator').html( dt.pg ).hide();
            $('#bottom_paginator').html( dt.pg ).hide();
        }
        
        if(dt.filter)
        {
             $('input:radio.xc-filter').filter('[value="'+dt.filter+'"]').prop('checked', true);
        }
        
        if(dt.aFilterCount)
        {
            $("div#catTotalAll").text( dt.aFilterCount.all );
            $("div#discountAll").text( dt.aFilterCount.discount );
            $("div#totalAll").text( dt.aFilterCount.bought );
            $("div#totalCM").text( dt.aFilterCount.comments );
            $("div#totalCF").text( dt.aFilterCount.comments_foto );   
        }
        
        if ( dt.bread_crumbs )
        {
            var str_bc = '';
            var cnt_bc = dt.bread_crumbs.length;
            $.each( dt.bread_crumbs, function(i,v) 
            {
                sClass = ( i == cnt_bc - 1 ) ? ' class="cur_page"' : '';
                sArrow = ( i > 0 ) ? ' → ' : '';
                sInner = ( i < cnt_bc - 1 ) ? '<a href="'+ v.url+'">'+ v.text +'</a>' : v.text ;
            
                str_bc += '<span '+sClass+'>'+ sArrow + sInner +'</span>';
            });
            
            $("div.navigation").html( str_bc );
            
        }
        

        $('#block_showcases').html( dt.html );

        set_categories();
        set_price_search();
        set_pagination();
        set_folder_a();
        //set_sorting();

        if( $(".xc-view-top").length > 0)
        {
            nTop = $(".xc-view-top").offset().top + $(".xc-view-top").outerHeight(true);
            
            nPageScroll = getPageScroll()[1];
     
            if ( nPageScroll > nTop )
            {
                if($.browser.safari)
                {
                    //$('body').animate( { scrollTop: destination }, 0 );
                    $('body').scrollTop( nTop );
                }
                else
                {
                    //$('html').animate( { scrollTop: destination }, 0 );
                    $('html').scrollTop( nTop );
                }
            }
        }

        onScrollResize();
    }

    function get_data(search)
    {
        if ( search == '' ) search = 'showcase/';

        search = clear_url(search);
		
        set_cur_page();

        nPrevPage = nCurPage;

        var sHashKey = SHOWCASE_ID+'i'+decodeURIComponent(search).hashCode();

        if ( sHashKey in aPagesCache )
        {
            show_items( aPagesCache[sHashKey] );
            load_predicted_page();
        }
        else
        {
            $('#block_showcases').html(
               '<div><div class="bg_loading relat s20bt"><div class="loader_cat abs"></div>' + 
               SC_Msg.loading + '</div></div>'
            );

            $('#bottom_paginator').html('');
            //$('.fav_menu').hide();
                        
            //hostname = typeof SC_SUBDOMAIN != 'undefined' ? location.hostname : 0;
            
            j.g( { g:'get_showcase_item', 
                   p:{
                       search: search, 
                       sc_id: SHOWCASE_ID 
                       //hostname: hostname 
                   } }, 
                function(dt) {

                if ( dt  )
                {
                    
                    aPagesCache[sHashKey] = dt;
                    show_items( dt );
                    load_predicted_page();
                    
                    // для стилизованных сheckbox
                    tpl.styleCheckbox();
                }
            });
        }
        // для стилизованных сheckbox
        tpl.styleCheckbox();
    }

    function load_predicted_page()
    {
        if ( ( nCurPage > 0 && nLastPage > 0 ) )
        {
            nLoadPage = 1; //0

            if ( nCurPage == nPrevPage+1 ) // Next
            {
                nLoadPage = ( nLastPage >= nCurPage+1 ) ? nCurPage+1: 0;
            }
            else if ( nCurPage == nPrevPage-1 ) // Previous
            {
                nLoadPage = ( 1 <= nCurPage-1 ) ? nCurPage-1: 0;
            }
            else if ( nCurPage < nLastPage )
            {
                nLoadPage = nCurPage+1;
            }

            if ( nLoadPage>0 )
            {
                oLastPg = $('.num_block a:last');

                if ( oLastPg.size() > 0 )
                {
                    if ( oLastPg.attr('href').match(/page\/\d+/) )
                    {
                        sPredUrl = oLastPg.attr('href').replace( /page\/\d+/, 'page/'+nLoadPage );
                        sPredUrl = clear_url(sPredUrl);
                                                
                        var sHashKey = SHOWCASE_ID+'i'+sPredUrl.hashCode();

                        if ( !(sHashKey in aPagesCache) )
                        {   
                            //hostname = typeof SC_SUBDOMAIN != 'undefined' ? location.hostname : 0;
                            
                            oPredicted =
                                j.g( {g:'get_showcase_item', 
                                    p:{ 
                                        search: sPredUrl, 
                                        sc_id: SHOWCASE_ID
                                        //hostname: hostname 
                                    } }, function(dt) {
                                    
                                    oPredicted = false;

                                    var nCnt = 0;
                                    for ( i in aPagesCache ) { nCnt++; }
                                    //if ( nCnt >= 100 ) aPagesCache = []; // TODO

                                    if ( dt )
                                    {
                                        aPagesCache[sHashKey] = dt;
                                    }
                                    
                                    // для стилизованных сheckbox
                                    tpl.styleCheckbox();
                                    
                                });
                        }
                    }
                }
            }
        }
    }

    function set_cur_page()
    {
        // Set current page number
        if ( ( aM = j.uri.get().match(/\/page\/(\d+)/) ) )
        {
            nCurPage  = parseInt(aM[1]);
        }
        else
        {
            nCurPage  = 1;
        }

        nLastPage = nCurPage;

        if ( $('.num_block a:last').length > 0 )
        {
            nLastPage = $('.num_block a:last').text();
        }
    }

    $('.mtb_del').live('click', function(e){
        if ( !oCurTinyDlg )
        {
            if (SHOWCASE_TYPE == 1){
                $(".xc_fold_name").text( SC_Msg.del_look );
            }else{
                $(".xc_fold_name").text( SC_Msg.del_folder )
            }
            
        	$('.fold_del_confirm_bl').attr( 'fold_id', $(this).closest('.folder_item').id() );
            $('.fold_del_confirm_bl').find('.conf_no_btn').focus();
            $('.fold_del_confirm_bl').show();

            //oCurTinyDlg = $('.fold_del_confirm_bl');

            e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true);
			
        }
    });
    
    
    // mtb_edit___222
    $('.xc_mng_look').live('click', function(e)
    {
        var this_xc_mng_look = $(this);
        // получаем id папки
        this_folder = $(this).closest('.folder_item');
        folder_id =  this_folder.id().replace(/folder:/, "");
        
        
        if ( this_folder.hasClass('xc_look_close'))
        {
            $(this).removeClass('mtb_look_close');
            $(this).addClass('mtb_look');
            
            this_folder.removeClass('xc_look_close');

            f_look = 1;
        }
        else
        {
            $(this).removeClass('mtb_look');
            $(this).addClass('mtb_look_close');
            
            this_folder.addClass('xc_look_close'); 
            
            f_look = 2;
        }
        
        
        //f_look = $(this).prop("checked") ? 2 : 1;
        
        param = {
            action: 'set',
            sc_id: SHOWCASE_ID,
            folder_id: folder_id,
            f_look: f_look
        }
        
        j.g({ g:'get_showcase_look', p:param }, 
        function(dt)
        {
            if( dt.msg.cnt0 )
            {
                ShowMsgLook( "div.folder_item[id='folder:"+folder_id+"']", dt.msg.cnt0 );
                // mtb_edit___222
                this_xc_mng_look.removeClass('mtb_look_close');
                this_xc_mng_look.addClass('mtb_look');
                
            }
            else
            {
                chLookReload = true;
            }
                
        });  
    });
    
    oErrLook = 0;
    
    function ShowMsgLook( oFld, sErrTxt, iOfs )
    {
        if ( !oErrLook )
        {
            oErrLook = $('<div style="color:black; left:-20px; width:70px;" class="error">' + sErrTxt + '</div>');
            
            if(iOfs)
            {
                oErrLook.css('left', iOfs +'px');
            }
            
            $(oFld).prepend(oErrLook).oneTime("3s", function() {
                oErrLook.hide(500, function() {
                    $(this).remove();
                    oErrLook = 0;
                });
            });
        }
        
        return false;
    }

    function UpdateFolders( oFolders )
    {
        if (oFolders)
        {
            $('#fold_cont .folder_item').remove();

            oMainCont = ( $('#fold_cont .jspPane').length > 0 ) ?
                          $('#fold_cont .jspPane'): $('#fold_cont');
            
            for( i in oFolders )
            {
                if ( oFolders[i].id == 0 ) continue;

                sCnt = '';
                if ( 'cnt' in oFolders[i] )
                {
                    sCnt = oFolders[i].cnt;
                }

                oFold = oFolderTpl.clone();

                if ( oFolders[i].id < 0 )  // No Folder
                {
                    fid = 0;
                    oFold.addClass('no_folder');
                    if ( sFoldersMode == 'manage' ) oFold.hide();
                }
                else
                {
                    fid = oFolders[i].id;
                }
                
                
                var str_look = '';
                if (SHOWCASE_TYPE == 1)
                {
                    //var checked = '';
                    var class_look = '';
                    if( oFolders[i].f_look == '2' )
                    {
                        //checked = 'checked="checked"';
                        oFold.addClass('xc_look_close');
                        
                        class_look = 'mtb_look_close';
                    }
                    else
                    {
                        class_look = 'mtb_look';
                    }
                    
                    str_look = '<div class="'+ class_look +' abs xc_mng_look"></div>';
                }
                
                
                oFold.attr( 'id', 'folder:' + fid );
                oFold.html(
                    str_look +
                    '<input type="hidden" class="xc_img_path" value="'+oFolders[i].img_path+'" />'+
                    '<span class="fold_title">'+oFolders[i].title+'</span>'+ 
                    '<div class="fold_cnt bought_count abs"><div>'+sCnt+'</div></div>' 
                );

                oMainCont.append( oFold );
            }

            set_folders_events();

            bNeedUpdate = true;
            
            //alert( bUserCanManage );
            
			if(bUserCanManage == 1 || bUserCanManage == 2 || bUserCanManage == 4)
			{
	            $('#fold_cont .folder_item').bind('mouseenter', function(){
	                if ( !$(this).hasClass('no_folder') )
	                {
	                    $('#fold_cont #manage_toolbar').remove();
	                    oTb = $('<div id="manage_toolbar"><div class="mtb_edit abs"></div><div class="mtb_del abs"></div></div>');
	                    $(this).append( oTb );
	                }
	            });
	       }

            $('#fold_cont .folder_item').bind('mouseleave', function(){
                $('#manage_toolbar').remove();
            });

            // Scrollbars re-init
            oScrollApi && oScrollApi.reinitialise();
        }

        return true;
    }

    function load_folders()
    {
        j.g( {g:'get_showcase_folders', p:{ sc_id: SHOWCASE_ID } }, function(dt) {

            if ( dt.folders )
            {
                // Folders' popup
                $('#fold_cont').html('');

                sOpts = '';

                for( i in dt.folders )
                {
                    bSeletedFolder = ( nCurFolderId == dt.folders[i].id );

                    sCnt = dt.folders[i].cnt; 

                    if ( dt.folders[i].cnt > 0 || dt.folders[i].id == 0 )
                    {
                        sOpts += '<option value="'+
                           dt.folders[i].id+'"' + 
                           ( bSeletedFolder ? ' selected="selected"': '' ) +
                           '>'+dt.folders[i].title + ' ('+ sCnt + ')' +
                        '</option>';
                    }

                    if ( dt.folders[i].id != 0 )
                    {
                        oFold = oFolderTpl.clone();

                        if ( dt.folders[i].id < 0 )  // No Folder
                        {
                            fid = 0;
                            oFold.addClass('no_folder');
                        }
                        else
                        {
                            fid = dt.folders[i].id;
                        }

                        oFold.attr( 'id', 'folder:' + fid );
                        //oFold.attr( 'title', dt.folders[i].title );
                        oFold.html(
                            '<span class="fold_title">'+dt.folders[i].title+'</span>'+ 
                            '<div class="fold_cnt bought_count abs"><div>'+sCnt+'</div></div>'
                        );

                        // Выделяем текущую папку
                        if ( bSeletedFolder )
                        {
                            oFold.addClass('sel_folder');
                        }

                        $('#fold_cont').append( oFold );
                    }
                }

                UpdateFolders( dt.folders );
                bNeedUpdate = false;
            }
        });
    }
    // teshl
    /*function set_folders()
    {
        $('#folder_sel').change(function(){

            val = $(this).find("option:selected").val();
            uri = j.uri.get();

            if ( uri.match(/\/folder\/[\-\d]+\//) )
            {
                uri = uri.replace(/\/folder\/[\-\d]+\//, '/folder/'+val+'/')
            }
            else
            {
                uri = uri.replace(/\/$/, '') + '/folder/'+val+'/'
            }

            if ( uri.match(/\/page\/\d+\//) )
            {
                uri = uri.replace(/\/page\/\d+\//, '/page/1/')
            }

            sender = $(this);
            j.uri.set( clear_url(uri) );
            
            return false;
        });

    }*/

    function set_folders_events()
    {
        $('#fold_cont .folder_item').click( function(){

            sActId = $(this).attr('id');

            $('#fold_cont .folder_item').each( function(){
                if ( sActId == $(this).attr('id') )
                {
                    //$(this).css( {'background-color':'#ff8200'} );
                    $(this).addClass("sel_folder");
                }
                else
                {
                    //$(this).css({'background-color':'inherit'});
                    $(this).removeClass("sel_folder");
                }
            });
        });
    }
// teshl117
    function set_categories()
    {
        $('div.par_cat a').click(function(){
            sender = $(this);
            j.uri.set( clear_url( $(this).attr('href') ) );
            return false;
        });
    }

    function set_price_search()
    {
        $('#price_search').click(function(){

            var str = '';
            //var min_price = $('#min_price').val(), max_price = $('#max_price').val();

            var min_price = parseInt($('#min_price').val()), max_price = parseInt($('#max_price').val());

            min_price = ( isNaN( min_price ) || min_price <= 0 ) ? 0: min_price;
            max_price = ( isNaN( max_price ) || max_price <= 0 ) ? 0: max_price;

            if( min_price || max_price ) 
            {
                str += min_price+'-'+max_price;
            }

            if ( str != '' )
            {
                sender = $(this);
                sUrl = j.uri.change( 'price', str );
                sUrl = j.uri.change( 'page', '1', sUrl );
                j.uri.set( clear_url( sUrl ) );
            }
        });
    }
    
    function set_folder_a()
    {
        $('a.xc-folder-list').click(function(){
            sender = $(this);
            j.uri.set( clear_url( $(this).attr('href') ) );
            return false;
        });
    }

    function set_pagination()
    {
        var $oLastPg = $('.num_block a:last');

        if ( $oLastPg.length > 0 )
        {
            nLastPage = parseInt( $oLastPg.text() );
        }
        else
        {
            nLastPage = 1;
        }
        
        $('.tb_pagination a').click(function(){
            sender = $(this);
            j.uri.set( clear_url( $(this).attr('href') ) );
            return false;
        });

        $('.pagination_next, .pagination_prev').click(function(){
            url = $(this).attr('href');
            if ( url && url != '#' )
            {
                sender = $(this);
                j.uri.set( clear_url(url) );
            }
            return false;
        });

        next_url = $('a.pagination_next').attr('href')
        if ( next_url && next_url != '#' )
        {
            oNext = $('<div class="abs next_cat" title="'+SC_Msg.forward+'"></div>');
            $('#block_showcases').prepend( oNext );
            //onScrollResize();
        }

        $('#block_showcases div.next_cat').click(function(){
            $('#top_paginator .pagination_next').click();
            return false;
        });

        $('.limit a').click(function(){
            sender = $(this);
            j.uri.set( clear_url( $(this).attr('href') ) );
            return false;
        });

        function clean_up(sel)
        {
            fld = $(sel).val().replace(/[^\d]+/, '');
            fld = fld.substring(0,5);

            if ( fld.length > 0 &&
                parseInt(fld) > parseInt( $('.num_block a:last').text() ) )
            {
                fld = $('.num_block a:last').text();
            }

            if ( fld !== $(sel).val() )
            {
                $(sel).val(fld);
            }
        }

        // Только цифры
        $('.go_page').bind( 'input paste keyup', function(e) {

            oThis = this;

            if ( e.type == 'paste' )
            {
                setTimeout( function() { clean_up(oThis); }, 100 );
            }
            else
            {
                clean_up(oThis);
            }
        });

        $('.go_page').keypress( function(event) {
            if ( event.which == 13 )
            {
                sender = $(this);
                if ( $(this).val().match(/^\d+$/) )
                {
                    nPage = parseInt( $(this).val() );
                    $oFirstPg = $('.num_block a:first');

                    if ( $oFirstPg.length > 0 &&
                        nPage >= parseInt( $oFirstPg.text() ) &&
                        nPage <= parseInt( $('.num_block a:last').text() ) )
                    {
                        if ( $oFirstPg.attr('href').match(/page\/\d+/) )
                        {
                            $(this).blur();
                            sUrl = $oFirstPg.attr('href').replace( /page\/\d+/, 'page/'+nPage );
                            j.uri.set( clear_url( sUrl ) );
                        }
                    }
                }
                $(this).val('');
            }
        });

        tpl.styleTooltip();
    }

    set_categories();
    set_price_search();
    set_pagination();
    set_folder_a();
    
    oErrFolder = 0;
    
    function ShowErrorFolder( oFld, sErrTxt, iOfs )
    {
        if ( !oErrFolder )
        {
            oErrFolder = $('<div style="color:black; bottom:50px;" class="error"><div style="margin-top:-5px;">' + sErrTxt + '</div></div>');
            
            if(iOfs)
            {
                oErrFolder.css('left', iOfs +'px');
            }
            
            $(oFld).before(oErrFolder).oneTime("3s", function() {
                oErrFolder.hide(500, function() {
                    $(this).remove();
                    oErrFolder = 0;
                });
            });
        }
        
        return false;
    }
    
    $("#fold_name_edit").keypress(function(event) {
        if ( event.which == 13 )
        {
            $('.conf_yes_btn').click();  
        }
    });

    $('.conf_yes_btn').click( function(){
        
        var edit_img = 0;
        
        if ( $("ol.qq-upload-list li").length > 0){
            edit_img = 1;
            DEL_IMG = 0;
        }
        
        if ( $(this).closest('.tiny_dlg').hasClass('fold_edit_bl') )
        {
            j.g({ g:'showcases/renamefolder', 
                  p:{ 
                  		sc_id    : SHOWCASE_ID,
                  		folder   : $(this).closest('.tiny_dlg').attr('fold_id'),
                      	title    :  $('#fold_name_edit').val(),
                      	sc_type  : SHOWCASE_TYPE,
                      	uploadId : uploadId,
                      	edit_img : edit_img,
                      	del_img  : DEL_IMG
                	}
                }, 
                function(dt)
                {
                    if( dt.err.same_name )
                    {
                        ShowErrorFolder( "div.b_mvdialog", dt.err.same_name);
                        return 0;
                    }
                    
                	if ( dt.folder_id !== 0 )
                	{
                	    bNeedUpdate = true;
                		str_f_id = 'folder:' + dt.folder_id;
                		
                		if (dt.action == 'add' )
                		{	
                		    str_ch = ''; 
                		    if (SHOWCASE_TYPE == 1){
                		      str_ch = '<div class="mtb_look abs xc_mng_look"></div>';
                		    }
                		    
                		    // mtb_edit___222
		                    str_folder = '<div class="f_l folder_item" style="display:none;" id="'+ str_f_id +'">'+
		                        str_ch +
		                    	'<span class="fold_title xc_hgf">'+ dt.title +'</span>'+
		                    	'<div class="fold_cnt bought_count abs">'+
		                    		'<div>'+dt.prod_cnt+'</div>'+
		                    	'</div>'+
		                    '</div>';
		                    
		                    $("div#fold_cont div.jspPane").prepend(str_folder);
		                    
		                    $("div[id='"+ str_f_id +"']").show(500);
		                    
		                    $('#folder_sel').append('<option value="'+ dt.folder_id +'">'+ dt.title +' (0)</option>');
		                    
		                    oScrollApi.reinitialise();
	                	}else if( dt.action == 'rename' )
	                	{
	                		$("div[id='"+ str_f_id +"'] span.fold_title").text( dt.title );
	                		$("#folder_sel option[value="+ dt.folder_id +"]").text( dt.title + " ("+dt.prod_cnt+")" );
	                	}

	                    
	                    if(bUserCanManage == 1 || bUserCanManage == 2 || bUserCanManage == 4 )
	                    {
		                    $('#fold_cont .folder_item').bind('mouseenter', function(){
				                if ( !$(this).hasClass('no_folder') )
				                {
				                    $('#fold_cont #manage_toolbar').remove();
				                    
	                                oTb = $('<div id="manage_toolbar"><div class="mtb_edit abs"></div><div class="mtb_del abs"></div></div>');
				                    $(this).append( oTb );
				                }
	                	
	                    		set_folders_events();
	            			});
						}
			            $('#fold_cont .folder_item').bind('mouseleave', function(){
			                $('#manage_toolbar').remove();
			            });
                	}
                    //dt.folders && UpdateFolders( dt.folders );

                }
            );
        }
        else // ..hasClass('fold_del_confirm_bl')
        {
        	var folder_id = $(this).closest('.tiny_dlg').attr('fold_id');
        	
        	$("div[id='folder:"+folder_id+"']").css('opacity',0.3);
        	
            j.g({ g:'showcases/delfolder', 
                  p:{ sc_id: SHOWCASE_ID, folder: folder_id }
                }, 
                function(dt)
                {
                    //dt.folders && UpdateFolders( dt.folders );
                    //j.uri.set( sPageUrl + 'page/1/' );                    
                    //$('a.tr_close').click();
                    
                    if(dt.msg.del)
                    {
                    	ShowTooltipDelFolder( folder_id, dt.msg.del, true);	
                    }else if(dt.msg.norole){
                    	ShowTooltipDelFolder( folder_id, dt.msg.norole, false );
                    }
                    
                }
            );
        }

        $(this).closest('.tiny_dlg').hide();
        $('#folder_img img.pre_view_image').attr('src','');
        $('#folder_img').hide();
        
        //$('.fold_del_confirm_bl').hide();

        oCurTinyDlg = false;
    });
    
    function ShowTooltipDelFolder( del_folder_id, text, f_del )
    {
		//oErr = $('<div style="color:black; position:absolute; left:40px; top:30px; width:30px;">' + text + '</div>');
		
		oFld = "div[id='folder:" + del_folder_id + "']";
		
		if ( f_del )
		{
			$(oFld)/*.prepend(oErr)*/.oneTime("1s", function() {
				$(this).hide(500, function(){
					$(this).remove();
					$("#folder_sel option[value="+ del_folder_id +"]").remove();
					oScrollApi.reinitialise();
				});
			});
		}
		else
		{
			$(oFld)/*.prepend(oErr)*/.oneTime("1s", function() {
				$(this).hide(500, function() {
			    	$(this).remove();
				});
			});	
		}
        return false;
    }
    
    
    $('.conf_no_btn').click( function(){
        
        $(this).closest('.tiny_dlg').hide();
        $('#folder_img img.pre_view_image').attr('src','');
        $('#folder_img').hide();
        oCurTinyDlg = false;
    });

    $('.fold_del_confirm_bl').live('keydown', function(e){
        if (e.keyCode == 27)
        {
            $(this).hide();
            e.stopPropagation();
        }
    });

    if ( j.uri.a )
    {
        get_data( clear_url(j.uri.get()) );
    }

    j.uri.click( function(){
        get_data( clear_url(j.uri.get()) );
    });

    set_cur_page();
    //get_data( clear_url(j.uri.get()) );

    load_folders();
    load_predicted_page();

    //set_folders();
    
    manageFolder = 0;

    $('#folders_cont .folder_edit').click( function() {
		if( bUserCanManage )
		{
			manageFolder = 1;
			
			$('a[rel=#mvdialog]').click();
		}
		
        //return false;
    });

  /*  $('a[rel=#mvdialog]').click( function(event) {
    	//$('.move_btn_wrp').show();
    	//manageFolder = 0;
        // hack
        //sFoldersMode = ( typeof( event.screenX ) == 'undefined' ) ? 'manage': 'move';
    });
*/
    $('a[rel=#mvdialog]').bind('onBeforeLoad', function() {
        
    	sFoldersMode = manageFolder ? 'manage': 'move';

    	var prod_ids = [];

        $('#block_showcases.categories_list input[type=checkbox]').each(function() {
            oCh = $(this);

            if ( oCh.is('[checked]') ||
                 oCh.attr('checked') == 'checked' ) // Opera Fix)
            {
                prod_ids.push( oCh.attr('id').replace( /^[^\:]*\:/ , '') );
            }
        });
        
        if( !manageFolder && isLookClose ){
            ShowErrorTooltip( "#moveItemsTr", "Оформленный лук <br> нельзя изменять" ,50);
            return false;
        }

        if ( manageFolder || prod_ids.length > 0 )
        {
	    	if( bUserCanManage == 3 ){
	    		$('.create_btn_wrp').hide();
	    	}else{
	    		$('.create_btn_wrp').show();
	    	}
	    	
	    	// если лук то соответственные названия для папок
	
	        if ( sFoldersMode == 'move' )
	        {
	            if( SHOWCASE_TYPE == 1 ){
	                $("#hide_close_look").show();
	                $("#ch_hide_close_look").change();
                    
                    $('#mvdlg_title').text( SC_Msg.move_to_look );
                }else{
                    $("#hide_close_look").hide();
                    
                    $('#mvdlg_title').text( SC_Msg.move_to_folder );    
                }
                	            
	            $('.move_btn_wrp').show();
	            $('.create_btn_wrp').hide();
	            $('#fold_cont .no_folder').show();
	        }
	        else if ( sFoldersMode == 'manage' )
	        {
                if( SHOWCASE_TYPE == 1 ){
                    $("#hide_close_look").show();
                    $("#ch_hide_close_look").change();
                    
                    $('#mvdlg_title').text( SC_Msg.manage_looks );
                    $('#mvdialog_create_btn').val( SC_Msg.create_look );
                }else{
                    $("#hide_close_look").hide();
                    
                    $('#mvdlg_title').text( SC_Msg.manage_folders );
                    $('#mvdialog_create_btn').val( SC_Msg.create_folder );    
                }

	            $('.move_btn_wrp').hide();
	            $('.create_btn_wrp').show();
	            $('#fold_cont .no_folder').hide();
	        } 
	        
	        return true;      
       }
       else
       {
       		//event.preventDefault();
       		//event.stopPropagation();
       		
            ShowErrorTooltip( "#moveItemsTr", "Нет отмеченных товаров" ,50);    
       		return false;
       		
       }
    });

    $('a[rel=#mvdialog]').bind('onLoad', function() {
        var oFldList = $("#fold_cont");

        //if( oFldList[0].scrollHeight > oFldList.height())
        {
            oScrollApi = oFldList.jScrollPane().data('jsp');
        }
    });

    $('a[rel=#mvdialog]').bind('onClose', function() {
    	manageFolder = 0;
        $('.tiny_dlg').hide();
        $('#folder_img img.pre_view_image').attr('src','');
        $('#folder_img').hide();
        oCurTinyDlg = false;
        
        if ( bNeedUpdate || chLookReload ) 
        {
            window.location.reload();
        }
    });

    /*$(document).click( function(e){

        if ( oCurTinyDlg != false )
        {
            var nTop = oCurTinyDlg.offset().top,
                nLeft = oCurTinyDlg.offset().left;

            if ( e.clientY < nTop || 
                 e.clientY > ( nTop + oCurTinyDlg.outerHeight() ) || 
                 e.clientX < nLeft ||
                 e.clientX > nLeft + oCurTinyDlg.outerWidth()
            ) 
            {
                oCurTinyDlg.hide();
                oCurTinyDlg = false;

                e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true); 
            }
        }
    });*/
    
    $('.mtb_edit').live('click', function(e){
        console.log("mtb_edit -> click");
        console.log(!oCurTinyDlg);
        if ( !oCurTinyDlg )
        { 
            $('.fold_edit_bl .fold_name').text( SC_Msg.rename );
            
            var this_folder = $(this).closest('.folder_item');
            var folder_id = this_folder.id();
            
            var img_path = this_folder.find('.xc_img_path:first').val();
            
            if( img_path != '' && img_path != 'null' && img_path != undefined ){
                $('#folder_img img.pre_view_image').attr('src', img_path );
                $('#folder_img').show();
            }else{
                $('#folder_img img.pre_view_image').attr('src', '' );
                $('#folder_img').hide();
            }
            
            $('.fold_edit_bl').attr( 'fold_id', folder_id );
            $('#fold_name_edit').val( this_folder.find('.fold_title').text() ).focus();
            $('#fold_name_edit').focus();
            
            
            $('.fold_edit_bl ol.qq-upload-list').html('');
            $('.fold_edit_bl').show();
            
            oCurTinyDlg = true;//$('.fold_edit_bl');
            
            e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true);
        }
    });
    
    $('#mvdialog_create_btn').click( function(e){
        $('#folder_img').hide();
        if ( !oCurTinyDlg )
        {
            if( SHOWCASE_TYPE == 1 )
            {
                $('.fold_edit_bl .fold_name').text( SC_Msg.create_look );
            }else{
                $('.fold_edit_bl .fold_name').text( SC_Msg.create_folder );
            }
            
            $('.fold_edit_bl').attr('fold_id', 0);
            $('#fold_name_edit').val('').focus();
            
            $('.fold_edit_bl ol.qq-upload-list').html('');
            $('.fold_edit_bl').show();

            oCurTinyDlg = $('.fold_edit_bl');

            e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true); 
        }
    });

    //--------------------------------------

    $(document).keydown( function(e) {

        if ( e.ctrlKey )
        {
            var keyCode = e.keyCode || e.which,
            oArrow = { left:37, up:38, right:39, down:40 };

            switch ( keyCode )
            {
                case oArrow.left:
                        $('#top_paginator .pagination_prev').click();
                    break;

                case oArrow.right:
                        $('#top_paginator .pagination_next').click();
                    break;
            }
        }
    });
    
    function bread_crumbs_folder()
    {
        // вывод папки в которую перешли в хлебные крошки
        /*var val = $("#folder_sel").val();

        if ( val != 0 )
        { 
            var s_name_folder = $("#folder_sel option[value="+val+"]").text();
            var indx = s_name_folder.lastIndexOf(' (');
            var name_folder = s_name_folder.slice(0,indx);
            $("div.navigation span:last").html(" → "+name_folder);
        }
        else
        {
            $("div.navigation span:last").html('');
        }*/
    }

    $('#folder_sel').change(function(){
        bread_crumbs_folder();
        
        sUrl = j.uri.change( 'folder', $(this).val() );
        j.uri.set( clear_url( sUrl ) );
    });

    function onScrollResize()
    {
        var oFwdBtn = $('div.next_cat'), oProdCont = $('#block_showcases');

        if ( oFwdBtn.length == 1 )
        {
            var nTopScroll  = getPageScroll()[1];
            var nLeftScroll = getPageScroll()[0];

            oFwdBtn.css( 'position', 'fixed' );
            oFwdBtn.css( 'right', 'auto' );

            nLeft = oProdCont.offset().left + oProdCont.width() - nLeftScroll + 3;

            oFwdBtn.css( 'left', nLeft+'px' );

            var nTop = oProdCont.offset().top - nTopScroll;
            nTop = nTop>0 ? nTop: 0;

            var nBottom = oProdCont.offset().top + oProdCont.height() - nTopScroll;

            if ( nBottom > $(window).height() )
            {
                nBottom = $(window).height();
            }

            var nHeight = nBottom - nTop;

            if ( nHeight < oFwdBtn.width() )
            {
                nHeight = oFwdBtn.width();

                if ( nTop + nHeight > $(window).height() )
                {
                    nTop = $(window).height() - nHeight;
                }
            }

            oFwdBtn.css( 'height', nHeight );
            oFwdBtn.css( 'top', nTop );
        }
    }

    $(window).bind("resize", onScrollResize );
    $(window).bind("scroll", onScrollResize );
    //onScrollResize();
    

	// удаление выбранных продуктов
    $("a#delScProds").click(function()
    { 
        if( isLookClose ){
            ShowErrorTooltip( "#delScProds", "Оформленный лук <br> нельзя изменять");
            return false;
        }
            
    	var folder_id = $("#folder_sel").val();  
    	
	    var prod_ids = [];

        $('#block_showcases.categories_list input[type=checkbox]').each(function() {
            oCh = $(this);

            if ( oCh.is('[checked]') ||
                 oCh.attr('checked') == 'checked' ) // Opera Fix)
            {
                prod_ids.push( oCh.attr('id').replace( /^[^\:]*\:/ , '') );
            }
        });
        
        if ( prod_ids.length > 0 )
        {
        
	        popupDialog({
	            kind    : 'confirm',
	            title   : 'Подтверждение удаления',
	            msg     : 'Вы уверены?',
	            yesbtn  : 'Да',
	            nobtn   : 'Нет',
	            func    : function()
	            {
	           		$("#delScProds").oneTime(500, function() {
						qwe(folder_id, prod_ids);	
					});
					
	            }
	        });
	    }
	    else
	    {

            ShowErrorTooltip( "#delScProds", "Нет отмеченных товаров");    
	    }
                	
	});
	
	function qwe(folder_id, prod_ids)
	{
		var param = {
			action: 'sel_prod_del',
			sc_id: SHOWCASE_ID,
			folder_id: folder_id,
			prod_ids: prod_ids
		};
		
		j.g( {g:'get_showcase_foldersedit', p: param }, function(dt)
		{
			if( dt.msg.noroledel ){
		
				$("div.apple2_mask").css('opacity','1').show();
				popupDialog({
					kind    : 'alert',
					title   : 'Сообщение',
					msg     : dt.msg.noroledel,
					closebtn: SC_Msg.close/*,
					func    : function(){
	           			$("div.apple2_mask:first").css("opacity","0");
	           		}*/
				});
				
			}else if( dt.msg.del )
			{
				$("div.apple2_mask").css('opacity','1').show();
				popupDialog({
		    		kind    : 'alert',
		    		title   : 'Сообщение',
		    		msg     : dt.msg.del,
		    		closebtn: SC_Msg.close/*,
					func    : function(){
	           			$("div.apple2_mask:first").css("opacity","0");
	           		}*/
				});
    	
		    	window.location.reload();
			}
			
		});
	}
	

    // Перемещение избранного в выбранную папку
    $('#mvdialog_move_btn').click( function(){
        
        var sCurSection = 'showcase';

        oFold = $('#fold_cont .sel_folder:first');
        
        if (oFold.hasClass('xc_look_close'))
        {
            ShowErrorTooltip( "#mvdialog_move_btn", "Оформленный лук <br> нельзя изменять");
            return false;
        }

        if ( oFold.length > 0 )
        {
            aFavIds = [];

            $('#block_showcases input[type=checkbox]').each(function() {
                oCh = $(this);

                if ( oCh.is('[checked]') ||
                     oCh.attr('checked') == 'checked' ) // Opera Fix)
                {
                    aFavIds.push( oCh.attr('id').replace( /^[^\:]*\:/ , '') );
                }
            });

            if ( aFavIds.length > 0 )
            {
            	folder_id = oFold.id();
            	if( folder_id == 0){
            		folder_id =-1;
            	}
            	
            	folder_from = $("#folder_sel").val();
            	
                oParams = {
                    sc_id        : SHOWCASE_ID,
                    sc_type      : SHOWCASE_TYPE,
                    folder_from  : folder_from,
                    folder_to    : folder_id,
                    ids          : aFavIds
                }

                j.g( {g:'showcases/move', p:oParams }, function(dt) 
                {
                    $('a[rel=#mvdialog]').overlay().close();
                    
                    $("div.apple2_mask").remove();
                    
                    if ( dt.msg.nomove )
                    {
                		popupDialog({
                			kind    : 'alert',
                			title   : 'Сообщение',
                			msg     : dt.msg.nomove,
                			closebtn: SC_Msg.close
            			});
                    }
                    else
                    {
                    	window.location.reload();
                    }
                });
            }
        }

    });


	// установка папки если на указана в url
	a_folder_id = j.uri.get().match(/\/folder\/([-+]?\b[0-9]*\,?[0-9]+\b)\//);
	if(a_folder_id !== null)
	{
		$("#folder_sel option[value="+ a_folder_id[1] +"]").attr("selected", "selected");
		$("div#folders_cont div.select").text( $("#folder_sel option[value="+ a_folder_id[1] +"]").text() );
	}
	
	oErr = 0;
	
	function ShowErrorTooltip( oFld, sErrTxt, iOfs )
    {
    	if ( !oErr )
    	{
			oErr = $('<div style="color:black;" class="error">' + sErrTxt + '</div>');
			
			if(iOfs)
			{
				oErr.css('left', iOfs +'px');
			}
			
			$(oFld).before(oErr).oneTime("3s", function() {
				oErr.hide(500, function() {
			    	$(this).remove();
			    	oErr = 0;
				});
			});
		}
		
        return false;
    }
    
    // для фильтра
    /*
	function initTotals() {
	    var params = loadParams(paramsFromPage(params), []);
	
	    $.ajax({
	        type:'POST',
	        url:'/a/bought/totals',
	        data: params.data,
	        success:function (response) {
	            var objResponse = JSON.parse(response);
	            updateTotalSpans(objResponse);
	        }
	    });
	}
	
	initTotals();
	*/
	
    $("input:radio.xc-filter").click(function () {
    	 sUrl = j.uri.change( 'page', 1 );
    	 sUrl = j.uri.change( 'filter', $(this).val(), sUrl);
         j.uri.set( clear_url( sUrl ) );
	    //get_data( clear_url(j.uri.get()) );
    });
    
    $(".radioLabel").click(function () {
        var radioDiv = $(this).parent().find(".radio");
        if (radioDiv.hasClass('rad_act')) {
            return false;
        }
        radioDiv.click();
        return false;
    });
    

	function oParamsFromUrl()
	{
		var sParams = window.location.hash.slice(2);
		
		var aParams = str_params.split("/");
		
		var oParams = {};
		
		for(i=0; i<aParams.length; i+=2)
		{
			oParams[ aParams[i] ] = aParams[i+1];
		}
		
	    return oParams;
	}
	
	// вывод папки в которую перешли в хлебные крошки
    bread_crumbs_folder();
     
    // Подписаться на уведомление при изменении витрины
    $("#ch_subscribe_add_prod").change( function(){
        
        param = { 
            action: ( $(this).prop('checked') ? 'subscribe' : 'unsubscribe' ), 
            sc_id: SHOWCASE_ID 
        }
        
        j.g( {g:'get_showcase_subscribe', p: param }, function(dt) {
            if ( dt  )
            {
                ShowErrorTooltip( "#ch_subscribe_add_prod", dt.msg);
            }
        });
    });
    
    // Добавить / Удалить витрину в/из избранного
    $("#ch_sc_fav").live('click',function(){
        var t = $(this);
        
        t.text( SC_Msg.wait );
        
        param = { 
            action: ( $(this).hasClass('add_izbr') ? 'add' : 'del' ), 
            sc_id: SHOWCASE_ID 
        }
        
        j.g( {g:'get_showcase_addscfavs', p: param }, function(dt) {
            if ( dt )
            {
                if ( dt.action == 'add' )
                    t.removeClass('add_izbr').addClass('del_izbr');
                else
                    t.removeClass('del_izbr').addClass('add_izbr');
                
                t.text( dt.msg );
            }
        });
        
        return false;
    });
    
    // скрыть закрытые луки в управлении луками
    $("#ch_hide_close_look").change(function(){
        if( $(this).prop('checked') )
        {
            $("div#fold_cont  div.xc_look_close").hide();
        }
        else
        {
           $("div#fold_cont  div.xc_look_close").show();
        }
    });
    
    $("#ch_hide_close_look").change();
    
    // Cмотреть папками / товарами
    $("#ch_folder_prod_list").change(function(){
        if( $(this).prop('checked') )
        {
           //sUrl = j.uri.change( 'viewf', '1' );
           //j.uri.set( clear_url( sUrl ) );
           get_data('viewf/1');
        }
        else
        {
           
           //sUrl = j.uri.change( 'viewf', '0' );
           //j.uri.set( clear_url( sUrl ) );
           get_data( '/' );
        }
    });
    
    $("#mng_search_folder").keypress( function(event) {
        if ( event.which == 13 )
        {
            if ( $("#ch_hide_close_look").prop("checked") )
            {
                $("#ch_hide_close_look_wrapper").removeClass("ch_act");
                $("#ch_hide_close_look").prop("checked", false);
            }
            
            var str_search = $(this).val();
            if (str_search != '' ){
                $("div#fold_cont  div.folder_item").not(".no_folder").each(function(){
                    
                    var name_folder = $(this).find("span.fold_title").text();
                    
                    if ( name_folder.search( str_search ) == -1){
                        
                        $(this).hide();
                        
                    }else{
                        $(this).show();
                    }    
                });
            }else{
                $("div#fold_cont  div.folder_item").not(".no_folder").show();
            }
        }
    });
    
    // удаление изображения для папки
    var DEL_IMG = 0;
    $("#sc_img_remove").click( function(){
        DEL_IMG = 1;
        $('#folder_img img.pre_view_image').attr('src','');
        $('#folder_img').hide();
    });
    
    // выделить весь товар
    $("#sc_all_prod").change( function(){
         if ( $("#sc_all_prod").prop('checked') )
         {
            $('#block_showcases.categories_list input[type=checkbox]').prop('checked', true);
            $("div.xc-product-element div.checkbox").addClass("ch_act");
         }
         else
         {
             $('#block_showcases.categories_list input[type=checkbox]').prop('checked', false);
             $("div.xc-product-element div.checkbox").removeClass("ch_act");
         }
    });
});

