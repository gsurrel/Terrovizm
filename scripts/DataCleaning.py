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

data.drop(columns_to_drop, axis=1, inplace=True)

full_country_counts = data['country_txt'].value_counts()
missing_country_counts = data[data.latitude.isnull()]['country_txt'].value_counts()

missing_fraction_country = missing_country_counts.divide(full_country_counts, fill_value=0)

significant_missing = missing_fraction_country[missing_fraction_country >= 0.5]

full_yearly_counts = data['iyear'].value_counts()
missing_yearly_counts = data[data.latitude.isnull()]['iyear'].value_counts()

missing_fraction_yearly = missing_yearly_counts.divide(full_yearly_counts, fill_value=0)

andorra_lat = 42.544033
andorra_long = 1.556309
data.loc[data['country_txt']=='Andorra', 'latitude'] = andorra_lat
data.loc[data['country_txt']=='Andorra', 'longitude'] = andorra_long

data = data[~data.latitude.isnull()]

conventions_dict = {}

conventions_dict['attacktype'] = data[['attacktype1', 'attacktype1_txt']].set_index('attacktype1').to_dict()['attacktype1_txt']
conventions_dict['attacktype']

conventions_dict['targtype'] = data[['targtype1','targtype1_txt']].set_index('targtype1').to_dict()['targtype1_txt']
conventions_dict['targtype']

targsubtype_notnull_index = data.targsubtype1.notnull()
conventions_dict['targsubtype'] = data[targsubtype_notnull_index][['targsubtype1','targsubtype1_txt']].set_index('targsubtype1').to_dict()['targsubtype1_txt']
conventions_dict['targsubtype']

conventions_dict['weaptype'] = data[['weaptype1','weaptype1_txt']].set_index('weaptype1').to_dict()['weaptype1_txt']
if 4 not in conventions_dict['weaptype']:
    conventions_dict['weaptype'][4]='Nuclear'
conventions_dict['weaptype']

conventions_dict['country'] = data[['country', 'country_txt']].set_index('country').to_dict()['country_txt']
conventions_dict['country']

conventions_dict['region'] = data[['region','region_txt']].set_index('region').to_dict()['region_txt']
conventions_dict['region']

textual_columns_to_drop = ['country_txt','region_txt','attacktype1_txt','attacktype2_txt','attacktype3_txt',
                          'targtype1_txt','targsubtype1_txt','targtype2_txt','targsubtype2_txt','targtype3_txt',
                          'targsubtype3_txt','weaptype1_txt','weaptype2_txt','weaptype3_txt',
                          'weaptype4_txt']
data = data.drop(textual_columns_to_drop,axis=1)

data.to_json('cleaned_data.json', orient='values')
columns_dict = {}
for col, idx in zip(data.columns, range(len(data.columns))):
    columns_dict[col] = idx

import json
with open('conventions.json', 'w') as fp:
    json.dump(str(conventions_dict), fp)
    
with open('columns.json', 'w') as fp:
    json.dump(str(columns_dict), fp)

