<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Showcase extends Taobao
{
    protected $content_template = 'showcase';

    protected $cached = false;

    protected function setup_statics()
    {
        parent::setup_statics();
        
       
        $this->statics->script_add_var('SC_Msg', array(
            'close' => __('Закрыть'),
            'wait' => __('Подождите. Идет отправка...'),
            'loading' => __('Загрузка'),
            'forward' => __('Вперед'),
            'rename' => __('Переименовать'),
            
            'create_folder' => __('Создать папку'),
            'del_folder' => __('Удалить папку?'),
            'move_to_folder' => __('Переместить в папку'),
            'manage_folders' => __('Управление папками'),
            
            'create_look' => __('Создать лук'),
            'del_look' => __('Удалить лук?'),
            'move_to_look' => __('Переместить в лук'),
            'manage_looks' => __('Управление луками'),
            
            'wait' => __('Подождите...')
            
        ));
        
        $this->statics->script_add_var('SCS', array(
            'create' => __('Создание витрины'),
            'edit' => __('Редактирование витрины'),
            'close' => __('Закрыть'),
            'confirm' => __('Подтверждение удаления'),
            'msgConfirm' =>__('Товары этой витрины тоже будут удалены!'),
            'admin' => __('Администратор'),
            'free' => __('Свободно'),
            'nofree' => __('Занято')
        ));
        
        $this->statics->script_add_var('oMsgs', array(
            'wait' => __('Подождите. Идет отправка...'),
            'loading' => __('Загрузка'),
            'forward' => __('Вперед')
        ));
        
    }

    public function before()
    {
        $this->controller = 'showcase';
 

        return parent::before();
    }

    public function after()
    {
        return parent::after();
    }
    
    public function action_index()
    {
        //Showcase::prof( 1 );
        
        $subdomain = $this->request->param('subdomain',false);
        
        $aSearch = explode('/', $this->request->param('uri'));
        
        $nLimit = $this->session->get('showcase_limit') ?
                  $this->session->get('showcase_limit'): 16;

        $aParams = url::get_param( $aSearch, 
            array(
                'sc_id'     => array('numeric', 0), // Selected SC
                'folder'  => array('numeric', 0),
                'cat'     => array('numeric', 0),
                'price'   => array('string', 0),
                'page'    => array('numeric', 1),
                'limit'   => array('numeric', $nLimit),
                'filter' => array('numeric', 5),
                'viewf' => array('numeric', 0)
            )
        );
        
        $view_folder = $aParams['viewf'][1];
        $http_domain = '';
        
        if ($subdomain)
        {
            $oSC = ORM::factory('showcase')
                ->where('uri', '=', $subdomain)
                ->where('del', '=', 0)
                ->find();
                
            if ( $oSC->loaded() )
            {
                $aParams['sc_id'][1] = $oSC->id;
                $http_domain = 'http://' . $subdomain . '.' . CONFIG_DOMAIN . '/' . $this->lang . '/';
            }
        }
        else
        {
            // что бы убрать uri из строки запроса
            $aParams['sc_id'][1] = $aSearch[0];
        }
        
        $aCategories = array();
        $sItems      = '';
        $nTotal      = 0;

        $aPrice = array();
        if( !empty($aParams['price'][1]) )
        {
            $aPrice = explode( '-', $aParams['price'][1] );
            if( count($aPrice)!=2 || 
                !is_numeric($aPrice[0]) || !is_numeric($aPrice[1]) )
            {
                $aPrice = array();
            }
        }
        
        $filter = Showcase::PrepareParams($aParams);
        
        $oSC = ORM::factory('showcase')
                ->where('id', '=', $filter->showcase_id)
                ->where('del', '<>', 1)
                ->find();

        if ( !$oSC->loaded() )
        {
            $this->set_info( __('Витрина не найдена'), 
            '/'.$this->lang.'/showcases/' );
        }
        
        $bUserCanManage = 0;
        $user_id = 0;
        if($this->u)
        {
            $user_id = $this->u->id;
            //$bUserCanManage = Showcase::UserCanManage( $oSC->id, $this->u->id );
            //$bUserCanManage = Showcase::get_user_role( $this->u->id, $oSC->id );
            
            // проверяем права на папку
            $folder_id = isset($filter->folder_id) ? $filter->folder_id : 0;
            switch ($folder_id)
            {
                case 0: //папка Все
                    $bUserCanManage = Showcase::get_user_role( $this->u->id, $oSC->id );
                    if($bUserCanManage == 3 )
                    {   // если редактор то ему нельзя удалять из папки все
                        $bUserCanManage = 0;
                    }
                break;
                
                case -1: // без папки
                    $bUserCanManage = Showcase::get_user_role( $this->u->id, $oSC->id );
               break;
                
                default: // остальные папки
                    $bUserCanManage = Showcase::check_edit_folder( $this->u->id, $oSC->id, $folder_id );
                break;
            }
        }
        
        $aFilterCount = Showcase::get_filter_count( $aParams['sc_id'][1], $aParams['folder'][1] );
        
        // для реадктора-луков вывод его папок
        $aOnlyUser = array();
        if ($bUserCanManage == 4)
        {
            $aOnlyUser['only_user'] = $user_id;
        }
        $aFolders = Showcase::Folders( $oSC->id, $bWithTotal = TRUE, $oSC->type, $aOnlyUser);
        
        //Showcase::prof( 2 );
        $is_folder_list = false;

        if( ($oSC->type == 1 AND $aParams['folder'][1] == 0) OR $view_folder == 1 )
        {
            $aPar = array();
            $aPar['limit'] = $filter->limit;
            $aPar['offset'] = $filter->offset;

            if ( $view_folder == 1 )
            {
                $is_folder_list = true;
                $aPar['is_folder_list'] = 1;
            }else
            {
                $aPar['only_close_look'] = 1;
            }
            
            $aPar['cnt_products_img'] = 9;// количество картинок товара для лука
            
            $aItems_prod = Showcase::Folders( $oSC->id, $bWithTotal = TRUE, $oSC->type, $aPar );
            
            $nTotal = 0;
            if ( $is_folder_list )
            {
                // для обычных папок все
                $nTotal = count($aFolders);
            }
            else
            {
                // для луков только закрытые 
                foreach( $aFolders as $f )
                {
                    if ($f['f_look'] == 2)
                    {
                        $nTotal++;
                    }
                }
            }
            
            $oItemsView = $this->view_factory('wigets/showcase_look');
            $oItemsView->bUserCanManage = $bUserCanManage;
            $oItemsView->aItems  = $aItems_prod;
            $oItemsView->lng     = $this->lang;
            //$oItemsView->http_domain = $http_domain;
            $sItems              = $oItemsView->render();
        }
        else
        {
            //Showcase::prof( 21 );
            $aItems = Showcase::Select($filter);
            //Showcase::prof( 22 );
            $nTotal = Showcase::Count($filter);
            //Showcase::prof( 23 );
            $oItemsView = $this->view_factory('wigets/showcase_products_list');
            $oItemsView->bUserCanManage = $bUserCanManage;
            $oItemsView->aItems  = $aItems;
            $oItemsView->lng     = $this->lang;
            $oItemsView->showcase_id = $oSC->id;
            $sItems              = $oItemsView->render();
            //Showcase::prof( 24 );
        }
        
        //Showcase::prof( 3 );
        $subscribe_add_prod = FALSE;
        $is_sc_fav          = FALSE;
        
        if( $this->u )
        {
            $subscribe_add_prod =  Showcase::is_subscribe( $this->u->id, $oSC->id );
            $is_sc_fav = Showcase::is_sc_fav( $this->u->id, $oSC->id );
        }
        
        $oCategory = ORM::factory( 'category', isset($filter->categoryId) ?  $filter->categoryId : 0 );
        
        $oCatsView = $this->view_factory('wigets/showcase_categories');
        $oCatsView->lng          = $this->lang;
        $oCatsView->oCurCat      = $oCategory->loaded() ? $oCategory : 0;
        $oCatsView->aParams      = $aParams;
        $oCatsView->aSearch      = $aSearch;
        $oCatsView->aPrice       = array();
        $oCatsView->subscribe_add_prod = $subscribe_add_prod;
        $oCatsView->is_sc_fav = $is_sc_fav;
        $oCatsView->is_login = $this->u ? TRUE: FALSE;

        $oCatsView->aCategories = Showcase::Categories(
            $oCategory->loaded() ? $oCategory->id : 0,
            $oSC->id,
            $aParams['folder'][1]
        );
        
        //Showcase::prof( 4 );

        $oPaginator = Paginator::factory(array(
            'current_page'   => array( 
               'page'   => $aParams['page'][1], 
               'source' => '',
               'key'    => ''
             ),
            'total_items'    => $nTotal,
            'items_per_page' => isset($filter->limit) ? $filter->limit : 1,
            'view'           => $this->view_factory('paginator/showcases'),
            'count_out'      => 3,
            'count_in'       => 5,
            'auto_hide'      => false,
            'url_prefix'     => /*$http_domain != '' ? $http_domain :*/ '/'.$this->lang.'/'.$this->controller.'/',
            'aSearch'        => $aSearch,
            'limits'         => array(12, 16, 24, 48, 96),
        ));

        // Навигация
        $this->bread_crumbs[] = array(
           'url'  => "/{$this->lang}/", 
           'text' => __('Главная')
        );
        $this->bread_crumbs[] = array(
           'url'  => "/{$this->lang}/showcases/", 
           'text' => __('Витрины')
        );
        $this->bread_crumbs[] = array(
           'url'  =>  "/{$this->lang}/showcase/".$oSC->id.'/', 
           'text' => $oSC->title
        );
        
        if ( $aParams['folder'][1] != 0 )
        {
            $folder_name = '';
            foreach($aFolders as $folder)
            {
                if ($aParams['folder'][1] == $folder['id'])
                {
                    $folder_name = $folder['title'];
                    break;
                }
            }
            
            $this->bread_crumbs[] = array(
               'url'  =>  ($oSC->uri != '') ? 'http://'.$oSC->uri.'.'.CONFIG_DOMAIN : "/{$this->lang}/showcase/".$oSC->id.'/', 
               'text' => $folder_name
            );
        }
 
        if( !empty($aParams['cat'][1]) )
        {
            $oC = ORM::factory('category')->where('id', '=', $aParams['cat'][1])->find();

            if ( $oC->loaded() )
            {
                $this->bread_crumbs[] = array(
                   'url'  => "/{$this->lang}/showcase/". url::set_search($aSearch, array('price' => '', 'page' => '') ),
                   'text' => $oC->{'title_'.$this->lang}
                );
            }
        }
        
        //Showcase::prof( 5 );
        $this->template->content->view_folder = $view_folder;
        
        $aSC = array(
            'id'       => $oSC->id,
            'title'    => $oSC->title,
            'uri'      => $oSC->uri,
            'img_path' => $oSC->img_path,
            'rating'   => $oSC->rating,
            'prod_cnt' => 0
        );
        $this->template->content->aSC = $aSC;
        
        $this->template->content->url_vk = $oSC->url_vk;
        
        $this->template->content->sc_type     = $oSC->type;
        $this->template->content->menu_sc_hide = $is_folder_list; //($oSC->type == 1 AND $aParams['folder'][1] == 0) OR  ? TRUE : FALSE;   
        
        $this->template->content->aFolders    = $aFolders;
        
        $this->template->content->is_folder_list = $is_folder_list;
        
        $this->template->content->sCategories =  $is_folder_list ? '' : $oCatsView->render();
        $this->template->content->bUserCanManage = $bUserCanManage;

        $this->template->content->aPrice      = $aPrice;
        $this->template->content->aSearch     = $aSearch;

        $this->template->content->aParams     = $aParams;
        $this->template->content->sItems      = $sItems;
        $this->template->content->sPaginator  = trim( $oPaginator->render() );
        $this->template->content->nTotal      = $nTotal;
        
        $this->template->content->filter      = isset($filter->filter)? $filter->filter: 5;
        
        $this->template->content->bread_crumbs = $this->bread_crumbs;
        
        // глобальная JS переменная ид витрины
        $this->statics->script_add_var('SHOWCASE_ID', $oSC->id);
        
        // глобальная JS переменная ид витрины
        $this->statics->script_add_var('SHOWCASE_TYPE', $oSC->type);
        
        // глобальная JS для субдомена
        $this->statics->script_add_var('SC_SUBDOMAIN', $http_domain);
        
        //является ли лук закрытым
        $isLookClose = FALSE;
        if( $aParams['folder'][1] > 0 )
        {
            $isLookClose = Showcase::isLookClose( $aParams['folder'][1] );
        }
        
        $this->statics->script_add_var('isLookClose', $isLookClose );
        
        // для доступов
        $this->statics->script_add_var('bUserCanManage', $bUserCanManage);
        
        //if (Kohana::DEVELOPMENT === Kohana::$environment)
        {
        
        // для фильтра
        $this->template->content->page    = $aParams['page'][1];
        $this->template->content->limit   = $aParams['limit'][1];
        $this->template->content->sort    = '0_sort'; //$aParams['sort'][1];
        $this->template->content->filter  = '5_filter'; //$aParams['filter'][1];
        $this->template->content->sorting = '0_sorting'; //$aParams['sorting'][1];
        $this->template->content->category_id = '0_category_id';
        
        // Количество товара для фильтра
        $this->template->content->aFilterCount = $aFilterCount;
        }
        
        $this->statics->script_add_var('nUsrId', $this->u ? $this->u->id : 0 );
        
        $this->statics->script_add_var('nPage', $aParams['page'][1] );
        $this->statics->script_add_var('nLimit', $aParams['limit'][1] );
        $this->statics->script_add_var('nTotal', $nTotal );
    }

}  // End Controller_Showcase

