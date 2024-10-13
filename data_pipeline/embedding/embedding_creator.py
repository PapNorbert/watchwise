from nomic import embed, atlas
import numpy as np
import time


def create_embeddings_for_movies_nomic(movies, fields_to_use):
    """
        Generates embeddings for movies using selected fields and adds 'embedding' value
        to the dictionary for each element

        :param movies: List of movie dictionaries.
        :param fields_to_use: List of keys from the movie dictionaries to
        be used for embedding (e.g., ['plot', 'genres', 'actors', 'directors']). :return: The movie list with
        embeddings added for each movie.
    """
    texts_to_embed = []
    for movie in movies:
        # create text for embedding for each movie based on specified fields to use
        combined_text = []
        for field in fields_to_use:
            # if the field is a list join it with commas
            if isinstance(movie[field], list):
                combined_text.append(', '.join(movie[field]))
            else:
                combined_text.append(movie[field])
        texts_to_embed.append(' '.join(combined_text))
    start_time = time.time()

    # generate all embeddings
    output = embed.text(
        texts=texts_to_embed,
        model='nomic-embed-text-v1.5',
        task_type='search_document',
        inference_mode='local'  # Enable local inference
    )

    embeddings = np.array(output['embeddings'])

    # # generate embeddings in batches
    # embeddings = []
    # batch_size = 200
    # print(f'Generating embeddings in batches, batch size: {batch_size}')
    # batch_start_time = time.time()
    # batch_end_time = time.time()
    # for i in range(0, len(texts_to_embed), batch_size):
    #     batch_start_time = time.time()
    #     batch_texts = texts_to_embed[i:i + batch_size]
    #     output = embed.text(
    #         texts=batch_texts,
    #         model='nomic-embed-text-v1.5',
    #         task_type='search_document',
    #         inference_mode='local'  # Enable local inference
    #     )
    #     embeddings.extend(output['embeddings'])
    #     batch_end_time = time.time()
    #     elapsed_time = batch_end_time - batch_start_time
    #     print(f"Processed batch {i // batch_size + 1}/{(len(texts_to_embed) + batch_size - 1) // batch_size}")
    #     print(f"Time taken: {elapsed_time:.2f} seconds")
    #
    # embeddings = np.array(embeddings)

    print("All embeddings generated successfully!")
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_minutes:.2f} minutes")

    # assign embeddings to movies
    for i, movie in enumerate(movies):
        movie['embedding'] = embeddings[i].tolist()

    try:
        # Upload embeddings and metadata to Atlas for visualization
        metadata = [
            {'movieId': movie['movieId'], 'title': movie['title'], 'genres': ', '.join(movie['genres'])}
            for movie in movies
        ]
        field_names = ','.join(fields_to_use)
        atlas.map_data(embeddings=embeddings, data=metadata, identifier=f'Movies {field_names}')
    except Exception as e:
        print(e)

    return movies


def create_embeddings_for_series_nomic(series, fields_to_use):
    """
        Generates embeddings for series using selected fields and adds 'embedding' value
        to the dictionary for each element

        :param series: List of serie dictionaries.
        :param fields_to_use: List of keys from the serie dictionaries to
        be used for embedding (e.g., ['plot', 'genres', 'actors', 'directors']). :return: The movie list with
        embeddings added for each movie.
    """
    texts_to_embed = []
    for serie in series:
        # create text for embedding for each serie based on specified fields to use
        combined_text = []
        for field in fields_to_use:
            # if the field is a list join it with commas
            if isinstance(serie[field], list):
                combined_text.append(', '.join(serie[field]))
            else:
                combined_text.append(serie[field])
        texts_to_embed.append(' '.join(combined_text))
    start_time = time.time()

    # generate all embeddings
    output = embed.text(
        texts=texts_to_embed,
        model='nomic-embed-text-v1.5',
        task_type='search_document',
        inference_mode='local'  # Enable local inference
    )

    embeddings = np.array(output['embeddings'])

    print("All embeddings generated successfully!")
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_minutes:.2f} minutes")

    # assign embeddings to series
    for i, serie in enumerate(series):
        serie['embedding'] = embeddings[i].tolist()

    try:
        # Upload embeddings and metadata to Atlas for visualization
        metadata = [
            {'serieId': serie['series_id'], 'title': serie['title'], 'genres': ', '.join(serie['genres'])}
            for serie in series
        ]
        field_names = ','.join(fields_to_use)
        atlas.map_data(embeddings=embeddings, data=metadata, identifier=f'Series {field_names}')
    except Exception as e:
        print(e)

    return series
