var cookies2switch = new Map();

// all
cookies2switch.set('*',['_ga', '__gads','__gac']);

// doubleclick
cookies2switch.set('doubleclick.net', ['ide','id','_#sess','_#srchist','_#uid','_#vdf','__ar_v4','__gads','__qca','__sonar','__troruid','__trosync','_carat_cr','_ct_rmm','_drt_','_mkto_trk','_sm_au_d','_svs','_svtri','705-ct','705-pv','705-sct','adx','asi_segs','c3uid','c3uid-650','carat_cr_parkdean','cnk_guid','dsid','ebNewBandWidth_.googleads.g.doubleclick.net','flc']);

// google
cookies2switch.set('google.com',['anid','dsid','flc','aid','taid','exchange_uid']);
cookies2switch.set('adwords.com',['anid','dsid','flc','aid','taid','exchange_uid']);

// facebook
cookies2switch.set('www.facebook.com',['__utma','__utmb','__utmz','_e_xxxx_xx','_gpl_it','_js_datr']);

// twitter
cookies2switch.set('twitter.com',['__qca','__utma','__utmb','__utmb', '__utmt','__utmv','__utmz', '_dc','_dc_a','_dc_b', '_gat', '_gat_a', '_gat_b','_gid','_mwl','_mws','_mwt','_mww',' _sm_au_d']);