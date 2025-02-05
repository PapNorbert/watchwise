import json


def create_train_data(movies: list[dict], series: list[dict], fields_to_use: list[str], save_filename: str,
                      train_filename: str):
    raw_train_data = read_raw_train_data(train_filename)
    train_data = []
    for data in raw_train_data:
        current_show = get_show(data['type'], data['key'], movies, series)
        current_show_text = create_show_text(current_show, fields_to_use)
        if data.get('most_similar'):
            similar_show = get_show(data['most_similar']['show_type'], data['most_similar']['show_key'], movies, series)
            similar_show_text = create_show_text(similar_show, fields_to_use)
            train_data.append({'text1': current_show_text, 'text2': similar_show_text,
                               'label': round(data['most_similar']['similarity'], 2)})
        if data.get('least_similar'):
            disimilar_show = get_show(data['least_similar']['show_type'], data['least_similar']['show_key'], movies,
                                      series)
            disimilar_show_text = create_show_text(disimilar_show, fields_to_use)
            train_data.append({'text1': current_show_text, 'text2': disimilar_show_text,
                               'label': round(data['least_similar']['similarity'], 2)})
    save_train_data(train_data, save_filename)


def save_train_data(train_data: list[dict], save_filename: str):
    with open(save_filename, 'w') as f:
        json.dump(train_data, f)


def create_show_text(show: dict, fields_to_use: list[str]):
    combined_text = []
    for field in fields_to_use:
        if isinstance(show[field], list):
            combined_text.append(', '.join(show[field]))
        else:
            combined_text.append(show[field])
    return ' '.join(combined_text)


def get_show(show_type, key, movies, series):
    if show_type == 'movie':
        return next((item for item in movies if item['movieId'] == key), None)
    else:
        return next((item for item in series if item['series_id'] == key), None)


def read_train_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
        return data


def read_raw_train_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
        return data[0]
