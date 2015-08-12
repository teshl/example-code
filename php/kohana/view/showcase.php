<div class="cat_list">

    <div class="navigation">
        <?foreach ($bread_crumbs as $k => $aB):
            $sClass = ( $k == count($bread_crumbs) - 1 ) ? ' class="cur_page"' : '';
            $sArrow = ( $k > 0 ) ? ' → ' : '';
            $sInner = ( $k < count($bread_crumbs) - 1 ) ? "<a href=\"{$aB['url']}\">" . html::chars($aB['text']) . '</a>' : html::chars($aB['text']);
        ?>
            <span<?=$sClass?>><?=$sArrow?><?=$sInner?></span>
        <?endforeach?>
    </div>

    <h1 class="all_cat_h1"><?=__('Витрина')?></h1>

    <div class="f_l subcat">
    
        <div class="categories_list" style="padding-left:40px;">
        <div id="<?=$aSC['id']?>" class="relat shadow f_l">
            <a id="sca_<?=$aSC['id']?>" class="cat_item element_product relat block xc-product-element" style="width:152px; height:152px;"
                href="<?=(($aSC['uri'] == '') ? '/'.$lng.'/showcase/'.$aSC['id'] : 'http://'.$aSC['uri'].'.'.CONFIG_DOMAIN)?>"> 
                <div class="pr_image_block">
                    <div class="name_product">
                        <div class="loader_gif abs"></div>
                        <div id="img_scid_<?=$aSC['id']?>" class="product_img" style="background: url(<?if( !empty( $aSC['img_path'] ) ):?><?=$aSC['img_path']?><?else:?>/media/i/template/1/main/nofoto.jpg<?endif?>) 50% 50% no-repeat;">
                        </div>
                    </div>
                     
                </div>        
            </a>
            
            <?if( $bUserCanManage == 1 ):?>
                <!--Для владельца-->
                <div class="abs sc_menu">
                    <a class="edit_sс f_l " rel="#dialog-edit-showcase" id="edit_sc:<?=$aSC['id']?>" title="<?= __('Редактировать витрину') ?>"></a>
                    <a class="edit_sc_editor f_l" rel="#dialog-editor-showcase" id="edit_role:<?=$aSC['id']?>" title="<?= __('Редактировать доступы редакторов витрины') ?>"></a>
                    <div class="sp"></div>
                </div>
            <?elseif( $bUserCanManage == 2 ):?>
                <!--Для администратора витрины-->
                <div class="abs sc_menu">
                    <a class="edit_sc_editor f_l" rel="#dialog-editor-showcase" id="edit_role:<?=$aSC['id']?>" title="<?= __('Редактировать доступы редакторов витрины') ?>"></a>
                    <div class="sp"></div>
                </div>
            <?endif;?>

        </div>
        </div>
        <div class="sp"></div>

        <div id="folder_prod_list" <?=($sc_type==1 ? 'style="display:none;"' : ''); ?> >
            <table style="margin-left:14px;">
            <tr>
                <td style="padding-top: 5px;">
                    <?= Form::label('ch_folder_prod_list', __('Cмотреть папками / товарами')); ?>:
                </td>
                <td>
                    <?= Form::checkbox('ch_folder_prod_list', '1', ($view_folder == 1), array('id' => 'ch_folder_prod_list')); ?>
                </td>
            </tr>
            </table>
            <br>
        </div>
        <!--<div id="folder_prod_list" style="display: inline;" >
            <div style="float: left;">

            </div>
            <div>
                
            </div>
        </div>-->
            
    	<div class="h_subcat xc-view-top" style="padding-top:3px;margin-bottom: 18px;">
            <div id="folders_cont" class="relative select_show duble_sh select_sort_body">
                <a class="abs block folder_edit" title="<?= $bUserCanManage ? __('Управлять папками') : '' ?>"></a>
<?
$aFlds = array();
if ($sc_type == 1)
{
    $aFlds[] = __('Выберите лук');
}
foreach( $aFolders as $k=>$aFld )
{
    if( $bUserCanManage == 0 AND $sc_type == 1 )
    {
        if( $aFld['f_look'] == 2 AND $aFld['cnt'] > 0 )
        {
            $aFlds[ $aFld['id'] ] = $aFld['title'] . ' ('.$aFld['cnt'].')';
        }
    }
    else
    {
        if( $sc_type == 1 )
        {
            if( $aFld['f_look'] == 1 )
            {
                $aFlds[ $aFld['id'] ] = $aFld['title'] . ' ('.$aFld['cnt'].')';
            }
        }
        else
        {
            $aFlds[ $aFld['id'] ] = $aFld['title'] . ' ('.$aFld['cnt'].')';
        }
    }
}
?>
                <div><?=Form::select( 'folder', $aFlds, NULL, array('id'=>'folder_sel') );?></div>
            </div>
        </div>
        
        <?if(isset($url_vk)):?>
        <div class="vitrina_vk">
            <?=html::anchor( 'http://vk.com/'.$url_vk, __('Мы Вконтакте!'), array( 'target' => '_blank' ))?>
        </div>
        <?endif;?>
        
        <div id="cats_list">
            <?=$sCategories?>
        </div>
    </div>
<?//if (Kohana::DEVELOPMENT === Kohana::$environment) { ?>
    <div class="f_l">
        <div class="sort_pr duble_sh" id="filter_up_list"  <?=( $is_folder_list ? 'style="display:none;"' : '')?> >
            <div class="duble_sh2">
            <?=Form::open('/'.$lng.'/showcases/', array(
                    'method' => 'POST',
                    'id' => 'form_filter'
                ))?>
                    <?=Form::hidden("ppage", $page, array('id' => 'page'))?>
                    <?=Form::hidden("plimit", $limit, array('id' => 'limit'))?>
                    <?=Form::hidden("cat_id", $category_id, array('id' => 'cat_id'))?>
                    <?=Form::hidden("user_id", '', array('id' => 'user_id'))?>
                    <?=Form::hidden("price_min", 0, array('id' => 'price_min'))?>
                    <?=Form::hidden("price_max", 0, array('id' => 'price_max'))?>
                    <?=Form::hidden("sort", $sorting, array('id' => 'sort_h'))?>
                <div class="radio_bought">
                    <?if($nTotal):?>
                        <div class="name f_l">
                            <div f="<?=$filter?>" class="reg_label1 f_l" title="<?=__('Все') ?>">
                                <?=Form::radio('filter', 5, $filter == 5, array(
                                    'class' => 'xc-filter'
                                ))?>
                            </div>
                            <div class="f_l radioLabel" title="<?=__('Все') ?>">
                                <a href="#">
                                    <span style="color: black">
                                        <?=__('Все')?>
                                    </span>
                                    <div class="f_r bought_count" style="display: block">
                                        <div id="catTotalAll">
                                            <?=$aFilterCount['all'] ?>
                                        </div>
                                    </div>
                                    <br class="sp"/>
                                </a>
                            </div>
                        </div>
                    <?endif?>
                    <div class="name f_l discount_item">
                        <div class="f_l" title="<?=__('Со скидками') ?>">
                            <?= Form::radio('filter', 1, $filter == 1, array(
                                    'class' => 'xc-filter'
                            )) ?>
                        </div>
                        <div class="f_l radioLabel" title="<?=__('Со скидками') ?>">
                            <a href="#">
                                <span style="color: black; font-weight:bold">
                                    <?=__('Со скидками')?>&nbsp;&nbsp;
                                </span>
                                <div class="f_r bought_count" style="display: hidden; margin-left:10px">
                                    <div id="discountAll">
                                        <?=$aFilterCount['discount']?>
                                    </div>
                                </div>
                                <br class="sp"/>
                                <div class="butt_on abs">new</div>
                            </a>
                        </div>
                    </div>
                    <div class="name f_l">
                        <div class="f_l" title="<?=__('Уже купили') ?>">
                            <?= Form::radio('filter', 2, $filter == 2, array(
                                    'class' => 'xc-filter'
                            )) ?>
                        </div>
                        <div class="f_l radioLabel" title="<?=__('Уже купили') ?>">
                            <a href="#">
                                <span style="color: black">
                                    <?=__('Уже купили')?>
                                </span>
                                <div class="f_r bought_count" style="display: hidden">
                                    <div id="totalAll"><?=$aFilterCount['bought']?></div>
                                </div>
                                <br class="sp"/>
                            </a>
                        </div>
                    </div>
                    <div class="name f_l">
                        <div class="f_l" title="<?=__('С отзывами') ?>">
                            <?= Form::radio('filter', 3, $filter == 3, array(
                                    'class' => 'xc-filter'
                            )) ?>
                        </div>
                        <div class="f_l radioLabel" title="<?=__('С отзывами') ?>">
                            <a href="#">
                                <span style="color: black">
                                    <?=__('С отзывами')?>
                                </span>
                                <div class="f_r bought_count" style="display: hidden">
                                    <div id="totalCM"><?=$aFilterCount['comments']?></div>
                                </div>
                                <br class="sp"/>
                            </a>
                        </div>
                    </div>
                    <div class="name f_l" style="margin-right:0">
                        <div class="f_l" title="<?=__('С отзывами и фото') ?>">
                            <?= Form::radio('filter', 4, $filter == 4, array(
                                    'class' => 'xc-filter'
                            )) ?>
                        </div>
                        <div class="f_l radioLabel" title="<?=__('С отзывами и фото') ?>">
                            <a href="#">
                                <span style="color: black">
                                    <?=__('С отзывами и фото')?>
                                </span>
                                <div class="f_r bought_count" style="display: hidden">
                                    <div id="totalCF"><?=$aFilterCount['comments_foto']?></div>
                                </div>
                                <br class="sp"/>
                            </a>
                        </div>
                    </div>
                    <br class="sp" />
                </div>

                <?=Form::close()?>
            </div>
        </div>
            
        <div class="sp"></div>
            <!--<div class="sort_pr duble_sh">

                <div class="duble_sh2" style="padding:0">

                    <div class="f_l">
                        <div class="select_show f_r relat duble_sh select_sort_body b_sort">
                        </div>
                    </div>

                    <div class="sp"></div>

                </div>
            </div>-->

            <div id="items_list">
<?
   $sPgCss = ( trim($sPaginator) == '' ) ? 'none': 'block';
?>
                <div id="top_paginator" style="display:<?=$sPgCss?>;">
                   <?=$sPaginator?>
                </div>

                <div class="categories_list relat" id="block_showcases">
                    <?=$sItems?>
                </div>

                <div id="bottom_paginator" style="display:<?=$sPgCss?>;">
                   <?=$sPaginator?>
                </div>

                <!-- Меню витрины -->

                <div class="fav_menu fav_menu2 w_block finder_cat_list relat" 
                    <?=( ($bUserCanManage ) ? '' : 'style="display:none;"')?> 
                    <?=($menu_sc_hide ? 'style="visibility:hidden;"' : '' )?>  >
                    
                    <div class="f_l relat">
                        <a class="apple2_effect" id="moveItemsTr" rel="#mvdialog">
                            <?=( $sc_type==0 ? __('Переместить в папку') : __('Переместить в лук'))?>
                        </a>
                    </div>
                    <div class="f_l relat f_del_but">
                        <a class="fav_menu_del" id="delScProds">
                            <?=__('Удалить из витрины')?>
                        </a>
                    </div>
                    
                    <div id="div_all_prod" class="f_l relat" >
                        <div style="float:left;margin-top:-5px"><?= Form::checkbox('sc_all_prod', NULL, FALSE, array('id' => 'sc_all_prod')); ?></div>
                        <div style="display:inline"><?= Form::label('sc_all_prod', __('Выбрать всё'), array('style'=>'color:#FF4E00; margin-left:5px;')); ?></div>
                    </div>
                    
                   
                    <div class="sp"></div>
                </div>

            </div>

            <div id="html" style="display:none;" class="search_result"></div>

        </div>
<?//}?>
    </div>

</div>

<!-- Begin overlay -->
<div class="apple_overlay" id="mvdialog"><a class="tr_close close"></a>
    <div class="info_wrapper"><div class="info"></div></div>
    <div class="inner">
	<h2 id="mvdlg_title" style="padding-bottom: 20px;"><?=__('Переместить в папку')?></h2>
        <div id="hide_close_look" class="f_l" style="display: inline;" >
            <div style="float: left;">
                <?= Form::label('ch_hide_close_look', __('Скрыть закрытые луки')); ?>:
            </div>
            <div style="float: right;  margin-top:-5px" >
                <?= Form::checkbox('ch_hide_close_look', '1', true, array('id' => 'ch_hide_close_look')); ?>
            </div>
        </div>
        <div style="left:350px; top: 30px; position:absolute;">
            <?= Form::input('mng_search_folder', '', array(
                'id' => 'mng_search_folder',
                'class' => 'styled_input', 
                'style' => 'width:150px;',
                'placeholder' => __('Поиск по названию ...')
            )) ?>
        </div>
        
        <div class="txtarea relat f_l">
          <div class="folders_block scrollable" id="fold_cont" style="max-height:117px;overflow:auto">
            <?foreach( $aFolders as $k=>$aFld ):
                if ( empty($aFld['id']) ) continue; ?>
                
                <div id="folder:<?=$aFld['id']?>" class="f_l folder_item"><?=html::chars( $aFld['title'] )?></div>
            
            <?endforeach?>
          </div>
        </div>
        <br class="sp" />

       <div class="f_l fold_edit_bl tiny_dlg" style="top: 50px; left: 50px; width: 450px;">
           <div class="fold_name s20btc"><?=__('Переименовать:')?></div>
           <?=Form::input('', __('Название редактируемой папки'), array(
                   'type' => "text",
                   'id' => "fold_name_edit",
                   'class' => "w_input",
                   'maxlength' => 25
                ))?>
            
                <?/*<div class="f_l" style="display: inline;">
                    <div style="float:left; margin-right:20px;" id="folder_img">
                        <img class="pre_view_image"  src="" />
                        <span id="sc_img_remove" class="sc_img_remove">
                            <img src="/media/i/template/1/main/remove.png">
                        </span>
                    </div>
                    <div>
                        <div id="file-uploader" style="margin: 0 0 30px 0px;" class="upload-place" upload-url="/<?= i18n::lang() ?>/upload/">
                            <noscript>          
                            <p>Please enable JavaScript to use file uploader.</p>
                            <!-- or put a simple form for upload here -->
                            </noscript>         
                        </div>
                        <div class="sp"></div>
                    </div>
                </div>*/?>
                <div>
                <table>
                <tr>
                    <td id="folder_img" style="padding-right:20px;">
                        <span id="sc_img_remove" class="sc_img_remove">
                            <img src="/media/i/template/1/main/remove.png">
                        </span>
                        <img class="pre_view_image"  src="" />
                    </td>
                    <td>
                        <div id="file-uploader" style="margin: 0 0 30px 0px;" class="upload-place" upload-url="/<?= i18n::lang() ?>/upload/">
                            <noscript>          
                            <p>Please enable JavaScript to use file uploader.</p>
                            <!-- or put a simple form for upload here -->
                            </noscript>         
                        </div>
                        <div class="sp"></div>
                    </td>
                </tr>
                </table>
                </div>
           
           <div class="navi_but" style="text-align: center ;">
                <div class="f_l" style="margin: 0 22px 0 16px;">
                  <?=Form::input('', __('Сохранить'), array(
                   'type' => "button",
                   'id' => "conf_yes_btn",
                   'class' => "cabinet_button conf_yes_btn",
                   ))?>
               </div>
               <div class="f_l">
                   <?=Form::input('', __('Отмена'), array(
                   'type' => "button",
                   'id' => "conf_no_btn",
                   'class' => "cabinet_button conf_no_btn",
                   ))?>
               </div>
               <div class="sp"></div>
           </div>
       </div>
       <div class="f_l fold_del_confirm_bl tiny_dlg" >
           <div class="fold_name s20btc xc_fold_name"><?=__('Удалить папку?')?></div>
           <div class="navi_but">
               <div class="f_l" style="margin: 0 22px;">
                  <?=Form::input('', __('Да'), array(
                   'type' => "button",
                   'id' => "d_conf_yes_btn",
                   'class' => "search_but conf_yes_btn",
                   ))?>
               </div>
               <div class="f_l">
                   <?=Form::input('', __('Нет'), array(
                   'type' => "button",
                   'id' => "d_conf_no_btn",
                   'class' => "search_but conf_no_btn",
                   ))?>
               </div>
               <div class="sp"></div>
           </div>
       </div>
       <br class="sp" />

       <div class="b_mvdialog">
          <div class="r_but f_l relat menu_item act move_btn_wrp">
               <div class="menu_l"></div>
               <div class="menu_m"></div>
               <div class="menu_r"></div>
               <div class="relat f_l">
                  <input type="button" id="mvdialog_move_btn" value="<?=__('Переместить')?>" />
               </div>
               <div class="sp"></div>
          </div>
          <div class="r_but f_l relat menu_item act create_btn_wrp">
               <div class="menu_l"></div>
               <div class="menu_m"></div>
               <div class="menu_r"></div>
               <div class="relat f_l">
                  <input type="button" id="mvdialog_create_btn" value="<?=__('Создать папку')?>" />
               </div>
               <div class="sp"></div>
          </div>
          <div class="r_but f_l relat menu_item act">
               <div class="menu_l"></div>
               <div class="menu_m"></div>
               <div class="menu_r"></div>
               <div class="relat f_l">
                  <input type="button" id="mvdialog_close_btn" class="close" value="<?=__('Закрыть')?>" />
               </div>
               <div class="sp"></div>
          </div>
          <div class="sp"></div>    
       </div>
    </div>
</div>
<!-- End overlay -->

<!-- Begin overlay for Edit -->
<?=View::factory( $tpl->get_path('wigets/showcase_dlg_edit'), array())?>
<!-- End overlay for Edit -->

<!-- Begin overlay for Editor -->
<?=View::factory( $tpl->get_path('wigets/showcase_dlg_role'), array())?>
<!-- End overlay for Editor -->
