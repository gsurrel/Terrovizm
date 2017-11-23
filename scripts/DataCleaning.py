
import pandas as pd
import os
data_filepath = os.path.join('data','globalterrorismdb_0617dist.xlsx')

data = pd.read_excel(data_filepath)

columns_to_drop = [
    'approxdate',
    'extended',
    'resolution',
    'summary',
    'crit1',
    'crit2',
    'crit3',
    'doubtterr',
    'alternative',
    'alternative_txt',
    'multiple',
    'related',
    'provstate',
    #'city',
    'vicinity',
    'location',
    'specificity',
    'success',
    'weapsubtype1',
    'weapsubtype1_txt',
    'weapsubtype2',
    'weapsubtype2_txt',
    'weapsubtype3',
    'weapsubtype3_txt',
    'weapsubtype4',
    'weapsubtype4_txt',
    'corp1',
    'target1',
    'natlty1',
    'natlty1_txt',
    'corp2',
    'target2',
    'natlty2',
    'natlty2_txt',
    'corp3',
    'target3',
    'natlty3',
    'natlty3_txt',
    'gsubname',
    'gsubname2',
    'gsubname3',
    'individual',
    'nperps',
    'nperpcap',
    'claimmode',
    'claimmode_txt',
    'compclaim',
    'claimmode2',
    'claimmode2_txt',
    'claimmode3',
    'claimmode3_txt',
    'nkillus',
    'nkillter',
    #'nwouldus',
    'nwoundte',
    'property',
    'propextent',
    'propextent_txt',
    'propvalue',
    'propcomment',
    'ishostkid',
    'nhostkid',
    #'ishostkidus',
    'nhostkidus',
    'nhours',
    'ndays',
    'divert',
    'kidhijcountry',
    'ransom',
    'ransomamt',
    #'ransomus',
    'ransomamtus',
    'ransompaid',
    'ransomnote',
    'hostkidoutcome',
    'hostkidoutcome_txt',
    'nreleased',
    'addnotes',
    'INT_LOG',
    'INT_IDEO',
    'INT_MISC',
    'INT_ANY',
    'scite1',
    'scite2',
    'scite3',
    'dbsource'
]


columns_to_keep = [
    'eventid',
    'iyear',
    'imonth',
    'iday',
    'country',
    'country_txt',
    'region',
    'region_txt',
    'latitude',
    'longitude',
    'attacktype1',
    'attacktype1_txt',
    'attacktype2',
    'attacktype2_txt',
    'attacktype3',
    'attacktype3_txt',
    'suicide',
    'weaptype1',
    'weaptype1_txt',
    'weaptype2',
    'weaptype2_txt',
    'weaptype3',
    'weaptype3_txt',
    'weaptype4',
    'weaptype4_txt',
    'targtype1',
    'targtype1_txt',
    'targtype2',
    'targtype2_txt',
    'targtype3',
    'targtype3_txt',
    'gname',
    'gname2',
    'gname3',
    'nkill',
    'nwould',
    
]

columns_dropped = data.columns.difference(columns_to_keep)
data.drop(columns_dropped, axis=1, inplace=True)


andorra_lat = 42.544033
andorra_long = 1.556309
data.loc[data['country_txt']=='Andorra', 'latitude'] = andorra_lat
data.loc[data['country_txt']=='Andorra', 'longitude'] = andorra_long


data = data[~data.latitude.isnull()]

refs_dict = {}

refs_dict['attacktype'] = dict(zip(data['attacktype1'].astype(str), data['attacktype1_txt']))

refs_dict['targtype'] = dict(zip(data['targtype1'].astype(str), data['targtype1_txt']))

if 'targsubtype1' in data.columns:
    targsubtype_notnull = data[data.targsubtype1.notnull()]
    reft_dict['targsubtype'] = dict(zip(targsubtype_notnull['targsubtype1'].astype(str),                                        targsubtype_notnull['targsubtype1_txt'])) 


refs_dict['weaptype'] = dict(zip(data['weaptype1'].astype(str), data['weaptype1_txt']))
if '4' not in refs_dict['weaptype']:
    refs_dict['weaptype']['4']='Nuclear'

refs_dict['country'] = dict(zip(data['country'].astype(str), data['country_txt']))

refs_dict['region'] = dict(zip(data['region'].astype(str), data['region_txt']))


textual_columns_to_drop = data.columns[data.columns.str.endswith('_txt')] 
data = data.drop(textual_columns_to_drop,axis=1)

def merge_column(row, base_column_name, number_of_columns):
    res = []
    for i in range(1,number_of_columns + 1):
        col_name = base_column_name + str(i)
        if row[col_name] == row[col_name]:
            res.append(row[col_name])
    return res

data.rename(columns={'gname':'gname1'}, inplace=True)

data['attacktype'], data['targtype'], data['weaptype'], data['gname'] = \
            zip(*data.apply(lambda row: (merge_column(row, 'attacktype', 3),
                                         merge_column(row, 'targtype', 3),
                                         merge_column(row, 'weaptype', 4),
                                         merge_column(row, 'gname', 3)), 
                            axis=1)
               )

cols_to_drop = ['attacktype1', 'attacktype2','attacktype3','targtype1','targtype2','targtype3','weaptype1','weaptype2','weaptype3','weaptype4','gname1','gname2','gname3']

data.drop(cols_to_drop, axis=1, inplace=True)

columns_dict = {}
for col, idx in zip(data.columns.astype(str), range(len(data.columns))):
    columns_dict[col] = idx

# we create a mapping for both ways: from column names to indices and from indices to column names
refs_dict['columns'] = {**{str(v): k for k, v in columns_dict.items()}, **columns_dict}


import json

events_list = json.loads(data.to_json(orient='values'))
final_data = {"refs":refs_dict,
             "events":events_list}

with open('db.json', 'w') as fp:
    json.dump(final_data, fp)
