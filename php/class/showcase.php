<?php defined('SYSPATH') or die('No direct access allowed.');

class Showcase
{
    protected static $model = 'showcase';
    public static $last_sql = '';

    public static function PrepareParams( $aParams = array() )
    {
        $filter = new StdClass;
        $filter->showcase_id = 0;

        if ( $aParams['sc_id'][1] )
        {
            $filter->showcase_id = $aParams['sc_id'][1];
        }

        if ( $aParams['folder'][1] )
        {
            $filter->folder_id = $aParams['folder'][1];
        }

        if ( $aParams['cat'][1] )
        {
            $filter->categoryId = $aParams['cat'][1];
        }

        if ( $aParams['limit'][1] )
        {
            $filter->limit = $aParams['limit'][1];
        }

        if ( $aParams['page'][1] )
        {
            $filter->offset = ($aParams['page'][1] - 1) * (isset($filter->limit) ? $filter->limit : 1);
        }
        
        if ( $aParams['filter'][1] )
        {
            $filter->filter = $aParams['filter'][1];
        }

        if ( $aParams['price'][1] )
        {
            $price = explode( '-', $aParams['price'][1] );

            if ( isset($price[0]) && is_numeric($price[0]) )
            {
                $filter->price_min = Price::reverse($price[0]);
            }

            if(isset($price[1]) && is_numeric($price[1]))
            {
                $filter->price_max = Price::reverse($price[1]);
            }
        }

        return $filter;
    }

    protected static function ProductsQuery()
    {
        return
            DB::select('scp.id', 'scp.showcase_id', 
                        'scp.product_id', 'scp.folder_id', 'p.category_id', 
                        array('p.name_'.I18n::lang(), 'name'),
                        'p.seller_id',
                        'p.seller_rate',
                        'p.image152x152',
                        'p.price', 'scp.created', 'p.discount',
                        'p.order_count',
                        'p.comment_count', 
                        'p.photo_count',
                        array('o.created', 'last_sell'))
            ->from( array('showcases_products', 'scp'))
            ->join( array('products', 'p'), 'INNER')
            ->on( 'scp.product_id', '=', 'p.product_id')
            ->join( array('orders', 'o'), 'LEFT')
            ->on( 'p.order_id', '=', 'o.id');
    }
    
    protected static $t_start = 0;
    
    public static function prof( $str )
    {
        $t_sub = time() - Showcase::$t_start;
        Showcase::$t_start = time();
    }

    public static function Select( $filter )
    {
        $oProducts = self::set_params( 
            self::ProductsQuery(),
            $filter
        );

        if ( isset($filter->limit) )
        {
            $oProducts->limit( $filter->limit );

            if ( isset($filter->offset) )
            {
                $oProducts->offset( $filter->offset );
            }
        }
            
        if ( isset($filter->order_by) )
        {
            $sDir = isset($filter->order_by_dir) 
                               ? $filter->order_by_dir: 'asc';
          $oProducts->order_by( $filter->order_by, $sDir );
        }

        self::$last_sql = (string) $oProducts;

        $aProds = $oProducts->execute()->as_array();
            
        $aProducts = array();
            
        $cnt_all = 0;
        
        foreach( $aProds as $k=>$aP )
        {
            $cnt_all++;
            $prod = Model::factory('External_Product')
                ->lang( I18n::lang() )
                ->product_id( $aP['product_id'] )
                ->any_cache()
                ->acquire();

            if(!$prod->has_data()) {
                $prod = Model::factory('External_ProductShort');
                $prod->lang = I18n::lang();
                $prod->product_id = $aP['product_id'];
                $prod->product_name = __('Информация о продукте недоступна');
                $prod->images =  array(0 => array('152x152' => ''));
                $prod->product_price = 0;
                $prod->post_fee = 0;
                $prod->product_volume = 0;
                $prod->category_id = 0;
                $prod->seller_nick = '';
                $prod->seller_score = 0;
                $prod->seller_state = '';
                $prod->seller_city = '';
                $prod->discount = array();
            }
            
            $prod->sell_count = $aP['order_count'];
            $prod->comment_count = $aP['comment_count'];
            $prod->last_sell = $aP['last_sell'];
            $prod->comment_count_file = $aP['photo_count'];

            $aProducts[] = $prod;
        }
        
        return $aProducts;
    }

    public static function Count( $filter )
    {
        $oProducts = self::set_params(
            self::ProductsQuery(),
            $filter
        );

        $oTotal = DB::select( DB::expr('COUNT(*) AS cnt') )
                   ->from( array( $oProducts, 'pr' ) );

        self::$last_sql = (string) $oTotal;

        $aTotalRes = $oTotal->execute()->current();

        return $aTotalRes['cnt'];
    }

    public static function Categories( $nCatId = 0, $nSCId = 0, $nFolderId = 0 )
    {
        $oQ = DB::select(
                'pc.id', 'pc.title_ru', 'pc.title_en', 'pc.title_zh', 
                 DB::expr('COUNT(*) AS cnt')
            )
            ->from( array('showcases_products', 'p') )
               ->join( array('categories', 'c'), 'INNER' )
                  ->on('p.category_id', '=', 'c.id')
               ->join( array('categories', 'pc'), 'INNER' )
                  ->on('c.left', '>=', 'pc.left')
                  ->on('c.left', '<=', 'pc.right')
            ->where('pc.parent_id', '=', $nCatId);

        if( !empty($nSCId) )
        {
            $oQ->where('p.showcase_id', '=', $nSCId );
        }

        if( !empty($nFolderId) )
        {
            $oQ->where('folder_id', '=', $nFolderId == -1 ? NULL : $nFolderId);
        }

        $oQ->group_by('pc.id', 'pc.title_ru', 'pc.title_en', 'pc.title_zh')
           ->order_by('pc.title_'.I18n::lang());

        return $oQ->execute()->as_array();
    }
    
    public static function Folders( $nSCId, $bWithTotal = TRUE, $sc_type = 0, $aPar = array() )
    {
/*
   SELECT id, title, IFNULL(cnt, 0) AS cnt
   FROM 
      ( SELECT -1 AS id, 'Без папки' AS title
        UNION
        SELECT id, title FROM showcases_folders
        WHERE `showcase_id` = 4 ) AS f

       LEFT JOIN (
             SELECT IFNULL(folder_id, -1) AS fld_id, COUNT(*) AS cnt
             FROM `showcases_products`
             WHERE `showcase_id` = 4
             GROUP BY folder_id
       ) AS p ON f.id = p.fld_id
*/
        $editor_id = 0;
        if ( isset($aPar['only_user']) )
        {
            $oEditor = ORM::factory('showcaseseditor')
                    ->where('showcase_id', '=', $nSCId)
                    ->where('user_id', '=', $aPar['only_user'])
                    ->find();

            if ( $oEditor->loaded() )
            {
                $editor_id = $oEditor->id;
            }
        }
        
        $sJoin = 'LEFT';
        if ( /*!isset($aPar['is_folder_list']) &&*/ $bWithTotal && $sc_type == 0 )
        {
            $sNoFolder = __('Без папки');
            $aFromF = array( 
                DB::select( array(DB::expr('-1'), 'id'), array(DB::expr("'{$sNoFolder}'"), 'title'), array(DB::expr(0), 'f_look'),array(DB::expr('""'), 'img_path'))
                ->union( DB::select('id','title','f_look', 'img_path')
                   ->from('showcases_folders')
                   ->where('showcase_id', '=', $nSCId)
            ), 'f');
            
        }
        else
        {
            $sql_FromF = DB::select('sf.id','sf.title','sf.f_look','sf.img_path')
                            ->from( array('showcases_folders', 'sf'))
                            ->where('sf.showcase_id', '=', $nSCId);
                            
            if ( $editor_id > 0)
            {
                $sql_FromF
                    ->join( array('showcases_editors_folders', 'sef'), 'LEFT' )
                        ->on('sef.folder_id', '=', 'sf.id')
                     ->where('sef.editor_id', '=', DB::expr($editor_id));
            }
            
            if ( isset($aPar['only_close_look']) )
            {
                $sql_FromF->where('f_look', '=', 2);
                $sJoin = 'INNER';
            }
            
            $aFromF = array( $sql_FromF, 'f');
        }

        $oQ = DB::select('f.id', 'title', DB::expr('IFNULL(cnt, 0) AS cnt'), 'f_look', 'img_path' )
                ->from(
                    $aFromF
                )
                ->join( 
                     array( DB::select( 
                                  DB::expr('IFNULL(folder_id, -1) AS fld_id'), 
                                  DB::expr('COUNT(*) AS cnt') )
                               ->from('showcases_products')
                               ->where('showcase_id', '=', $nSCId)
                               ->group_by('folder_id'), 'p' 
                     ), $sJoin 
                )
                ->on('f.id', '=', 'p.fld_id');
         
        /*if ( isset($aPar['cnt_products_img']) )
        {
            $oQ
                ->select( 'sp.product_id')
                ->join( array( 'showcases_products', 'sp' ), 'LEFT' )
                    ->on('sp.folder_id', '=', 'f.id');
        }*/
        
        if ( isset($aPar['limit']) )
        {
            $oQ->limit( $aPar['limit'] );
                    
            if ( isset($aPar['offset']) )
            {
                $oQ->offset( $aPar['offset'] );
            }
        }
        
        $aRes = $oQ->execute()->as_array();
       
        // Все товары
        if ( !isset($aPar['is_folder_list']) && $bWithTotal && $sc_type == 0 )
        {
            $nTotal = 0;

            foreach( $aRes as $k=>$aRow )
            {
                $nTotal += $aRow['cnt'];
            }

            array_unshift( $aRes, array('id' => 0, 'title' => __('Все'), 'cnt' => $nTotal) );
        }
        
        $aFolders = array();
        if ( count($aRes) > 0 )
        {
            if ( isset($aPar['cnt_products_img']) )
            {
                $aUnion = array();
                $cnt_sc1_prod = 9;
                $aFolderID = array();
                
                foreach( $aRes as $k => $val )
                {
                    $aFolderID[ $val['id'] ] = array('title' => $val['title'], 'cnt' => $val['cnt'], 'img_path' => $val['img_path']);
                    
                    $aUnion[] = '(SELECT folder_id, product_id
                                  FROM showcases_products 
                                  WHERE showcase_id = :showcase_id AND folder_id = '.$val['id'].' 
                                  ORDER BY product_id 
                                  LIMIT '.$cnt_sc1_prod.' )' ;
                }
                
                $sql_union = implode( 'UNION', $aUnion);
                
                $q_union = DB::query( Database::SELECT, $sql_union )
                                    ->parameters( array(':showcase_id' => $nSCId ));
                
                $resUnion = $q_union->execute()->as_array();
                if ( count($resUnion) )
                {
                    // Подготовка массива для вывода изображений для луков
                    $k = 0;
                    $resUnion[0]['title'] = $aFolderID[ $resUnion[0]['folder_id'] ]['title'];
                    $resUnion[0]['cnt'] = $aFolderID[ $resUnion[0]['folder_id'] ]['cnt'];
                    $aFolders[$k] = $resUnion[0];
                    
                    if ( $aFolderID[ $resUnion[0]['folder_id'] ]['img_path'] != '' )
                    {
                        $aFolders[$k]['img_path'] = $aFolderID[ $resUnion[0]['folder_id'] ]['img_path'];
                    }
                    else
                    {
                        // получаем изображение товара по id
                        $oProd = Model::factory('External_Product')
                            ->lang( I18n::lang() )
                            ->product_id( $resUnion[0]['product_id'] )
                            ->any_cache()
                            ->acquire();
                        
                        $url_img = '';
                        if( $oProd->has_data() )
                        {
                           $url_img = $oProd->image_url('152x152');
                        }
                        
                        $aFolders[$k]['prod_ids'] = array( $resUnion[0]['product_id'] => $url_img );
                    }
                    
                    $j = 1;
                    $cnt_img = $aPar['cnt_products_img'];
                    
                    for( $i = 1; $i < count($resUnion); $i++ )
                    {
                        if( $aFolders[$k]['folder_id'] == $resUnion[$i]['folder_id'] )
                        {
                            if ($j < $cnt_img)
                            {
                                if ( $aFolderID[ $resUnion[$i]['folder_id'] ]['img_path'] != '' )
                                {
                                    $aFolders[$k]['img_path'] = $aFolderID[ $resUnion[$i]['folder_id'] ]['img_path'];
                                }
                                else
                                {    
                                    // получаем изображение товара по id
                                    $oProd = Model::factory('External_Product')
                                        ->lang( I18n::lang() )
                                        ->product_id( $resUnion[$i]['product_id'] )
                                        ->any_cache()
                                        ->acquire();
                                    
                                    $url_img = '';
                                    if( $oProd->has_data() )
                                    {
                                       $url_img = $oProd->image_url('152x152');
                                    }
                                    
                                    $aFolders[$k]['prod_ids'][ $resUnion[$i]['product_id'] ] = $url_img;
                                }
                                $j++;
                            }
                        }
                        else
                        {
                            $j = 1;
                            $k++;
                            $resUnion[ $i ]['title'] = $aFolderID[ $resUnion[ $i ]['folder_id'] ]['title'];
                            $resUnion[ $i ]['cnt'] = $aFolderID[ $resUnion[ $i ]['folder_id'] ]['cnt'];
                            $aFolders[ $k ] = $resUnion[ $i ];
                            
                            if ( $aFolderID[ $resUnion[$i]['folder_id'] ]['img_path'] != '' )
                            {
                                $aFolders[$k]['img_path'] = $aFolderID[ $resUnion[$i]['folder_id'] ]['img_path'];
                            }
                            else
                            {    
                                // получаем изображение товара по id
                                $oProd = Model::factory('External_Product')
                                    ->lang( I18n::lang() )
                                    ->product_id( $resUnion[$i]['product_id'] )
                                    ->any_cache()
                                    ->acquire();
                                
                                $url_img = '';
                                if( $oProd->has_data() )
                                {
                                   $url_img = $oProd->image_url('152x152');
                                }
                                
                                $aFolders[$k]['prod_ids'] = array( $resUnion[$i]['product_id'] => $url_img  );
                            }
                        }
                    }
                }
            }
            else
            {
                // Подготовка массива
                foreach( $aRes as $k=>$aRow )
                {
                    $aFolders[] = $aRow;
                }
            }
        }
        
        return $aFolders;
    }

    protected static function set_params($oSelect, $filter)
    {
        if ( isset($filter->showcase_id) ) // должен быть установлен
        {
            $oSelect->where( 'scp.showcase_id', '=', $filter->showcase_id );
        }

        if ( isset($filter->categoryId) )
        {
            $oCat = ORM::factory('category', $filter->categoryId);

            if ( $oCat->loaded() )
            {
                $oSelect
                    ->where( 'p.category_id', 'IN', 
                        DB::select('id')
                               ->from('categories')
                               ->where('left', '>=', $oCat->left)
                               ->where('right', '<=', $oCat->right)
                    );
            } 
            else
            {
                $oSelect->where('p.category_id', '=', $filter->categoryId);
            }
        }

        if ( isset($filter->price_min) )
        {
            $oSelect->where('p.price', '>=', $filter->price_min);
        }

        if ( isset($filter->price_max) )
        {
            $oSelect->where('p.price', '<=', $filter->price_max);
        }

        if ( !empty($filter->folder_id) )
        {
            $oSelect->where('scp.folder_id', '=',
                // непонятно зачем если -1 это товар "Без папки"
                //$aPar['folder_id'] == -1 ? NULL : $aPar['folder_id'] );
                $aPar['folder_id'] = $filter->folder_id );
        }
        
        // фильтр
        if ( isset($filter->filter) )
        {
            switch ( $filter->filter )
            {
                case 5: // все
                break;
                
                case 1: // со скидками
                    $oSelect
                        ->where( 'p.discount', '>', 0 );
                break;
                
                case 2: // уже купили
                    $oSelect
                        ->where( 'p.order_count', '>', 0 );
                break;
                
                case 3: // с отзывами
                    $oSelect
                        ->where( 'p.comment_count', '>', 0 );
                break;
                
                case 4: // с отзывами и фото
                    $oSelect
                        ->where( 'p.photo_count', '>', 0 );
                break;
            }
        }

        if(!empty($filter->unique_products)) {
            $oSelect
                ->join(array(DB::select('product_id', DB::expr('MAX(showcase_id) showcase_id'))
                            ->from('showcases_products')
                            ->group_by('product_id'), 'uq'), 'INNER')
                ->on('scp.product_id', '=', 'uq.product_id')
                ->on('scp.showcase_id', '=', 'uq.showcase_id');
        }

        if(!empty($filter->q)) {
            $oSelect
                ->where( 'p.name_'.I18n::lang(), 'like', '%'.$filter->q.'%');
        }
        
        return $oSelect;
    }

    // Пользователь может управлять витриной
    public static function UserCanManage( $nSCId, $nUserId, $bool = TRUE )
    {
        $oSC = ORM::factory('showcase')
                   ->where('id', '=', $nSCId)
                   ->where('user_id', '=', $nUserId)
                   ->find();
        if(!$bool)
        {
            if($oSC->loaded())
            {
                return $oSC;
            }
        }
        return $oSC->loaded();
    }
    
    /* возращает роль пользователя витрины
    1 - владелец
    2 - админ
    3 - редактор
    4 - редактор луков
    0 - если не может управлять витриной
    */
    public static function get_user_role( $user_id, $showcase_id, $use_scid = TRUE )
    {
        //если надо узнать имеет ли пользователь какое либо отношение к витринам то $use_scid = FALSE
        $str_owner = '';
        $str_editor = '';
        
        if( $use_scid )
        {
            $str_owner = 'AND id = :showcase_id';
            $str_editor = 'AND showcase_id = :showcase_id';
        }
        
        $sql = DB::query( Database::SELECT,
           '(
                SELECT 1 AS role
                FROM `showcases`
                WHERE user_id = :user_id '.$str_owner.' 
            )
            UNION
            (
                SELECT 
                    CASE role
                        WHEN 0 THEN 3
                        WHEN 1 THEN 2
                        WHEN 2 THEN 4
                        ELSE 0
                    END AS role
                FROM `showcases_editors`
                WHERE user_id = :user_id '.$str_editor.' 
            )
            ')
            ->parameters( array(
                ':user_id' => $user_id,
                ':showcase_id' => $showcase_id
            ))
            ->execute();
        
        if( $sql->count() == 1 AND $use_scid )
        {
            return $sql[0]['role'];
        }
        else if (!$use_scid)
        {
            return $sql->count();
        }
        
        return 0;
    }
    
    // проверяем права на редактирование папки
        /* возращает роль пользователя витрины
    1 - владелец
    2 - админ
    3 - редактор
    4 - редактор лука
    0 - если не может управлять витриной
    */
    public static function check_edit_folder( $user_id, $showcase_id, $folder_id )
    {
        if ( $folder_id == -1 )
        {
            return Showcase::get_user_role( $user_id, $showcase_id );
        }
        
        $sql = DB::query( Database::SELECT,
           '(
                SELECT 1 AS role
                FROM `showcases_folders` sf 
                LEFT JOIN `showcases` s  ON s.id = sf.showcase_id
                WHERE s.user_id = :user_id AND s.id = :showcase_id
            )
            UNION
            (
                SELECT 2 AS role
                FROM `showcases_editors` se
                WHERE se.role = 1 AND se.user_id = :user_id  AND se.showcase_id = :showcase_id
            )
            UNION
            (
                SELECT 3 AS role
                FROM `showcases_editors` se
                LEFT JOIN  `showcases_editors_folders` sef ON sef.editor_id = se.id
                WHERE se.role = 0 AND se.user_id = :user_id AND se.showcase_id = :showcase_id AND sef.folder_id = :folder_id
            )
            UNION
            (
                SELECT 4 AS role
                FROM `showcases_editors` se
                LEFT JOIN  `showcases_editors_folders` sef ON sef.editor_id = se.id
                WHERE se.role = 2 AND se.user_id = :user_id AND se.showcase_id = :showcase_id AND sef.folder_id = :folder_id
            )
            ')
            ->parameters( array(
                ':user_id' => $user_id,
                ':showcase_id' => $showcase_id,
                ':folder_id' => $folder_id
            ))
            ->execute();
        
        if( $sql->count() == 1 )
        {
            return $sql[0]['role'];
        }
                
        return 0;
    }
    
    /* возращает роль пользователя витрины
    1 - владелец
    2 - админ
    3 - редактор
    4 - редактор лука
    0 - если не может управлять витриной
    */
    public static function get_showcases( $user_id , $from_favs = FALSE)
    {
        // получаем витрины с которыми может работать пользователь
        // пользователь может быть владельцем, админом, редактором, лук-редактором
        //role из таблицы 1-админ, 0-редактор папок, 2-лук редактор
        $str_from_favs = '';
        if ( $from_favs )
        {
            $str_from_favs = '
            UNION
            (
                SELECT id AS sc_id, CONCAT( title, " (Лук)") AS title, -1 as role
                FROM `showcases`
                WHERE user_id = :user_id AND del = 0 AND type = 1
            )
            UNION
            (
                SELECT distinct s.id AS sc_id, CONCAT( s.title, " (Лук)") AS title, -1 AS role 
                FROM `showcases` s
                LEFT JOIN `showcases_editors` se1 ON se1.showcase_id = s.id
                LEFT JOIN `showcases_editors_folders` sef ON sef.editor_id = se1.id
                where se1.user_id=:user_id
                AND se1.role = 2 
                AND s.del=0 
                AND s.type = 1
            ) ';
        }
        
        $sql = DB::query( Database::SELECT ,
            '(
                SELECT id AS sc_id, title AS title, 1 as role
                FROM `showcases`
                WHERE user_id = :user_id AND del = 0 AND type = 0
            )
            UNION
            (
                SELECT s.id AS sc_id, title AS title, 2 AS role
                FROM `showcases` s
                LEFT JOIN `showcases_editors` se1 ON se1.showcase_id = s.id
                where se1.user_id=:user_id AND se1.role = 1 AND s.del = 0 AND s.type = 0  
            )
            UNION
            (
                SELECT s.id AS sc_id, title AS title, 3 AS role
                FROM `showcases` s
                LEFT JOIN `showcases_editors` se1 ON se1.showcase_id = s.id
                where se1.user_id=:user_id AND se1.role = 0 AND s.del=0 AND s.type = 0
            )
            UNION
            (
                SELECT id AS sc_id, CONCAT( title, " (Лук)") AS title, 1 as role
                FROM `showcases`
                WHERE user_id = :user_id AND del = 0 AND type = 1
                AND id in (
                    SELECT showcase_id
                    FROM showcases_folders 
                    WHERE f_look = 1
                )
            )
            UNION
            (
                SELECT distinct s.id AS sc_id, CONCAT( s.title, " (Лук)") AS title, 4 AS role
                FROM `showcases` s
                LEFT JOIN `showcases_editors` se1 ON se1.showcase_id = s.id
                LEFT JOIN `showcases_editors_folders` sef ON sef.editor_id = se1.id
                where se1.user_id=:user_id
                AND se1.role = 2 
                AND s.del=0 
                AND s.type = 1
                AND s.id in (
                    SELECT showcase_id
                    FROM showcases_folders 
                    WHERE f_look = 1 AND id = sef.folder_id
                )
            )
            '. $str_from_favs )
            ->parameters( array(':user_id' => $user_id));
            
            $res = $sql->execute();
        
        if ($res->count() > 0){
            $showcases = array();
            foreach( $res as $v ){
                $showcases[] = array( 'sc_id'=>$v['sc_id'], 'title'=>$v['title'], 'role'=>$v['role'] );
            }
            return $showcases;
        }else{
            return false;
        }
    }
    
    public static function get_folders( $user_id, $showcase_id, $f_look = 0 )
    {
        // получаем папки витрины которые может изменять редактор
        // владелец - все папки
        // редактора - его папки
        // администратор - все папки
        
        $sql = DB::query( Database::SELECT,
           '(
                SELECT sf.id AS folder_id, sf.title
                FROM `showcases_folders` sf 
                LEFT JOIN `showcases` s  ON s.id = sf.showcase_id
                WHERE s.user_id = :user_id AND s.id = :showcase_id AND sf.f_look = :f_look
            )
            UNION
            (
                SELECT sf.id as folder_id, sf.title
                FROM `showcases_folders` sf  
                LEFT JOIN `showcases_editors_folders` sef ON sef.folder_id = sf.id 
                LEFT JOIN  `showcases_editors` se ON se.id = sef.editor_id
                WHERE se.role = 0 AND se.user_id = :user_id AND se.showcase_id = :showcase_id AND sf.f_look = :f_look
            )
            UNION
            (
                SELECT sf.id as folder_id, sf.title
                FROM `showcases_folders` sf  
                LEFT JOIN  `showcases_editors` se ON se.showcase_id  = sf.showcase_id
                WHERE se.role = 1 AND se.user_id = :user_id AND se.showcase_id = :showcase_id AND sf.f_look = :f_look
            )
            UNION
            (
                SELECT sf.id as folder_id, sf.title
                FROM `showcases_folders` sf  
                LEFT JOIN `showcases_editors_folders` sef ON sef.folder_id = sf.id 
                LEFT JOIN  `showcases_editors` se ON se.id = sef.editor_id
                WHERE se.role = 2 
                    AND se.user_id = :user_id 
                    AND se.showcase_id = :showcase_id
                    AND sf.f_look = :f_look
            )
            ')
        ->parameters( array(
            ':user_id' => $user_id,
            ':showcase_id' => $showcase_id,
            ':f_look' => $f_look
        ));
        
        $aFolders = $sql->execute();
        
        $folders = array();
        
        if( $f_look != 1)
        {
            $folders[] = array( 'folder_id' => -1, 'title' => __('Без папки') );
        }
        
        foreach( $aFolders as $v ){
            $folders[] = array( 'folder_id' => $v['folder_id'], 'title' => $v['title'] );
        }
        
        return $folders;
    }
    
    // является ли редактор администратором витрины
    public static function is_admin( $editor_id )
    {
        $oSC = ORM::factory('showcaseseditor')
           ->where('id', '=', $editor_id)
           ->where('role', '=', 1)
           ->find();
        
        return $oSC->loaded()? 1 :0;
    }
    
    // Получить Showcase по URI
    /*public static function GetByUri( $sUri )
    {
        return ORM::factory('showcase')
                       ->where('uri', '=', $sUri)
                       ->find();
    }*/
    
    public static function move($showcase_id, $folder_id_from, $folder_id_to, $product_ids, $sc_type)
    {
        /*
         * Сейчас нет уникального ключа по `showcase_id`, `product_id` 
         * (для витрины был доступен только один товар во всех папках)
         * потому что в луках может быть повторяющийся товар в витрине, 
         * уникальный товар только в самих папках луках
        */
        
        $str_folder_id_from = ' AND `folder_id` = :folder_id_from ';
        
        if ($folder_id_from == 0)
        {
            $str_folder_id_from = '';
        }
           
        $query = DB::query( Database::INSERT,
           'INSERT INTO `showcases_products`(`id`, `product_id`, `folder_id` )
            SELECT `id`, `product_id`, `folder_id`
            FROM `showcases_products`
            WHERE showcase_id = :showcase_id 
                '.$str_folder_id_from.'
                AND product_id IN :product_ids 
                AND product_id NOT IN (
                    SELECT product_id 
                    FROM `showcases_products` 
                    WHERE showcase_id = :showcase_id
                        AND `folder_id` = :folder_id_to 
                        AND product_id IN :product_ids )
            ON DUPLICATE KEY UPDATE folder_id = :folder_id_to')
            ->parameters( 
                array(
                    ':showcase_id' => $showcase_id, 
                    ':folder_id_from' => $folder_id_from,
                    ':folder_id_to' => $folder_id_to,
                    ':product_ids' => $product_ids
                )
            );
        
       
        $res = $query->execute();
        
        return $res;
    }
    
    public static function get_editors($showcase_id, $title_folders = FALSE, $onlyEditors = FALSE)
    {
        $editors = DB::select(
            DB::expr('u.id as user_id'), 
            'u.username',
            DB::expr('se.id AS editor_id'),
            'se.role' )
            ->from( array('showcases_editors', 'se') )
            ->join( array('users', 'u'), 'LEFT' )
                ->on('u.id', '=', 'se.user_id');
                
            if( $title_folders )
            {
                $editors 
                    ->select( DB::expr('sf.title AS title') )
                    ->join( array('showcases_editors_folders', 'sef'), 'LEFT' )
                        ->on('sef.editor_id', '=', 'se.id')
                    ->join( array('showcases_folders', 'sf'), 'LEFT' )
                        ->on('sf.id', '=', 'sef.folder_id');
            }
            
            $editors
                ->where('se.showcase_id', '=', $showcase_id);
            
            if ($onlyEditors)
            {
                $editors->where('se.role', '=', 0);
            }

            return $editors->as_object()->execute();
    }
    
    // добавление товара в папку витрины
    
    public static function add_product($showcase_id, $folder_id, $product_id, $category_id, $product_price, $product_discount)
    {
        return DB::insert('showcases_products', array('showcase_id', 'product_id', 'folder_id', 'category_id', 'price', 'created', 'discount'))
			->values(array($showcase_id, $product_id, $folder_id, $category_id, $product_price, date('Y-m-d H:i:s'), $product_discount))
			->execute();
    }
    
    public static function is_set_product($showcase_id, $product_id, $folder_id = NULL)
    {
        $oSC = ORM::factory('showcasesproduct')
            ->where('showcase_id', '=', $showcase_id)
            ->where('product_id', '=', $product_id);
        
        if( !is_null($folder_id) )
        {
            $oSC->where('folder_id', '=', $folder_id);
        }
        
        $res = $oSC->count_all();

        return $res;
    }
    
    public static function get_filter_count($showcase_id, $folder_id)
    {
        $str_folder = '';
        if( preg_match( '(^[0]{1}$|^[-]?[1-9]{1}\d*$)', $folder_id) )
        {
            if($folder_id != 0)
            {
                $str_folder =  'AND sp.folder_id = '.$folder_id;
            }
        }
        
        $q_filter_cnt = DB::query( Database::SELECT,
           '(
                SELECT "all" as name, count(*) AS cnt
                FROM `showcases_products` sp
                WHERE  sp.showcase_id = :showcase_id  '.$str_folder.' 
            )
            UNION ALL
           (
                SELECT "discount" as name, count(*) AS cnt
                FROM `showcases_products` sp
                WHERE  sp.showcase_id = :showcase_id '.$str_folder.' AND sp.discount = 1
            )
            UNION ALL
            (
                SELECT "bought" as name, count(distinct sp.product_id) AS cnt
                FROM `showcases_products` sp
                INNER JOIN `orders` o ON o.cid = sp.product_id
                WHERE  sp.showcase_id = :showcase_id '.$str_folder.'
            )
            UNION ALL
            (
                SELECT "comments" as name, count(distinct sp.product_id) AS cnt
                FROM `showcases_products` sp
                INNER JOIN `comments` c ON c.product_id = sp.product_id
                WHERE  sp.showcase_id = :showcase_id '.$str_folder.'
            )
            UNION ALL
            (
                SELECT "comments_foto" as name, count(distinct sp.product_id) AS cnt
                FROM `showcases_products` sp
                INNER JOIN `comments` c ON c.product_id = sp.product_id
                INNER JOIN `comments_files` cf ON cf.comment_id = c.id
                WHERE  sp.showcase_id = :showcase_id '.$str_folder.'
            )
            ')
        ->parameters( array(
            ':showcase_id' => $showcase_id
        ));
       
        $filter_cnt = $q_filter_cnt->execute();
        
        // all - Весь товар
        // discount - Со скидками
        // bought - Уже купили
        // comments - С отзывами
        // comments_foto - С отзывами и фото
        
        $filter_count = array(
            'all'=>$filter_cnt[0]['cnt'],
            'discount'=>$filter_cnt[1]['cnt'],
            'bought'=>$filter_cnt[2]['cnt'],
            'comments'=>$filter_cnt[3]['cnt'],
            'comments_foto'=>$filter_cnt[4]['cnt']
        );

        return $filter_count;
    }
    
    public static function copy_from_favs($showcase_id, $sc_folder_id, $user_id, $fav_folder_id, $fav_prod_ids = array())
    {
        $select_sc = DB::select('product_id')
                        ->from('showcases_products')
                        ->where('showcase_id', '=', $showcase_id);
        
        // если витрина-лук то в ней могут быть повторяющиеся товары, 
        // но в самих луках(папках) повторяющихся товаров быть не должно
        $is_look = Showcase::sc_is_look( $showcase_id );
        if( $is_look )
        {
            $select_sc->where('folder_id', '=', $sc_folder_id); 
        }
        
        $date_t = date('Y-m-d H:i:s');
        
        $select_fav = DB::select(
                        DB::expr( $showcase_id.' AS showcase_id'), 
                        'product_id',
                        DB::expr( $sc_folder_id.' AS folder_id'),
                        'category_id',
                        'price', 
                        DB::expr( '"'.$date_t.'" AS created')
                        )
                        ->from('favorite_products')
                        ->where('user_id', '=', $user_id )
                        ->where('product_id', 'NOT IN', $select_sc );
                        
        if ($fav_prod_ids)
        {
             $select_fav
                ->where('product_id', 'IN', $fav_prod_ids );
        }
        
        // если fav_folder_id == 0 значит перенести все товары из избранного
        if($fav_folder_id != 0)
        {
            if( $fav_folder_id == -1 )
            {
                // Без папки
                $fav_folder_id = NULL;
            }
            
            $select_fav
                ->where('folder_id', '=', $fav_folder_id );
        }
        
        $insert = DB::insert('showcases_products', array( 'showcase_id', 'product_id', 'folder_id', 'category_id', 'price', 'created' ))
                    ->select( $select_fav )
                    ->execute();
        return $insert;
    }
    
    public static function sc_is_look( $showcase_id )
    {
        $oSC = ORM::factory('showcase')
            ->where('id', '=', $showcase_id)
            ->where('type', '=', 1)
            ->where('del', '<>', 1)
            ->find();
        
        return $oSC->loaded();
    }
    
    public static function is_subscribe( $user_id, $showcase_id )
    {       
        $SC_no_del = DB::select('id')
                        ->from('showcases')
                        ->where('del', '<>', 1);
        
        $cnt = ORM::factory('showcasessubscribe')
            ->where('user_id', '=', $user_id)
            ->where('showcase_id', '=', $showcase_id)
            ->where('showcase_id', 'in', $SC_no_del)
            ->count_all();
        
        return ($cnt > 0 ? TRUE: FALSE);
    }
    
    public static function is_sc_fav( $user_id, $showcase_id )
    {       
        /*$SC_no_del = DB::select('id')
                        ->from('showcases')
                        ->where('del', '<>', 1);
        */
        $cnt = ORM::factory('Favorite_Showcase')
            ->where('user_id', '=', $user_id)
            ->where('showcase_id', '=', $showcase_id)
            //->where('showcase_id', 'in', $SC_no_del)
            ->count_all();
        
        return ($cnt > 0 ? TRUE: FALSE);
    }

    public static function save_showcase( $nSCId, $nUserId, $aFields )
    {
        $oSC = ORM::factory('showcase');

        if ( $nSCId != 0 )
        {
            $oSC->where('id', '=', $nSCId)->find();
        }
        else
        {
            $oSC->user_id = $nUserId;
            $oSC->created = date('Y-m-d H:i:s');

            // тип витрины 0-обычная, 1-лук
            $oSC->type    = $aFields['sc_type'];
        }

        $oSC->title       = $aFields['title'];
        $oSC->changed     = date('Y-m-d H:i:s');        
        $oSC->save();

        return $oSC->id;
    }
    
    public static function isLookClose( $folder_id )
    {
        $oFold = ORM::factory('showcasesfolder', $folder_id);

        if ( $oFold->loaded() )
        {
            return ($oFold->f_look == 2);
        }
        else
        {
           return FALSE;
        }
    }

}

