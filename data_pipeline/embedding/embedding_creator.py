from nomic import embed, atlas
import numpy as np
import time
from gensim.models import Word2Vec
from gensim.models.phrases import Phrases, Phraser
import nltk
import re
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

VECTOR_SIZE = 500


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
        be used for embedding (e.g., ['plot', 'genres', 'actors', 'directors']). :return: The serie list with
        embeddings added for each serie.
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
            {'serieId': serie['series_id'], 'title': serie['name'], 'genres': ', '.join(serie['genres'])}
            for serie in series
        ]
        field_names = ','.join(fields_to_use)
        atlas.map_data(embeddings=embeddings, data=metadata, identifier=f'Series {field_names}')
    except Exception as e:
        print(e)

    return series


def preprocess_text_word2vec(text):
    # Remove special characters and tokenize
    text = re.sub(r'\W+', ' ', text.lower())
    return nltk.word_tokenize(text)


def detect_phrases(corpus):
    # Phrases detects common bigrams (two-word phrases)
    bigram = Phrases(corpus, min_count=10, threshold=10)
    bigram_phraser = Phraser(bigram)

    # Apply the bigram detector to the corpus
    return [bigram_phraser[sentence] for sentence in corpus]


def create_embeddings_word2vec(shows, fields_to_use):
    """
        Generates embeddings for shows using selected fields and adds 'embedding' value
        to the dictionary for each element

        :param shows: List of show dictionaries.
        :param fields_to_use: List of keys from the serie dictionaries to
        be used for embedding (e.g., ['plot', 'genres', 'actors', 'directors']).
        :return: The shows list with embeddings added for each show.
    """

    nltk.download('punkt')
    nltk.download('punkt_tab')

    texts_to_embed = []
    for show in shows:
        combined_text = []
        for field in fields_to_use:
            # if the field is a list join it with commas
            if isinstance(show[field], list):
                combined_text.append(', '.join(show[field]))
            else:
                combined_text.append(show[field])
        texts_to_embed.append(preprocess_text_word2vec(' '.join(combined_text)))

    texts_to_embed_with_phrases = detect_phrases(texts_to_embed)

    print("Training Word2Vec model")
    start_time = time.time()
    model = Word2Vec(sentences=texts_to_embed_with_phrases, vector_size=VECTOR_SIZE, window=5,
                     min_count=2, workers=4, epochs=5)
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_seconds:.2f} seconds")

    print("Assigning embeddings to shows")
    word_vectors = model.wv
    del model

    start_time = time.time()
    for i, show in enumerate(shows):
        # Average the word vectors for all words in the show's text
        vectors = [word_vectors[word] for word in texts_to_embed_with_phrases[i] if word in word_vectors]
        if vectors:
            # average the vector
            show_embedding = np.zeros(VECTOR_SIZE)
            for vector in vectors:
                show_embedding += vector
            show_embedding /= len(vectors)
            show['embedding'] = show_embedding.tolist()
        else:
            show['embedding'] = [0] * VECTOR_SIZE

    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_seconds:.2f} seconds")

    return shows


def create_embeddings_sentence_transformer(series, movies, fields_to_use):
    print("Fine tuning model")
    start_time = time.time()
    # TODO train data
    fine_tuned_model = fine_tune_model([], 3)
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_seconds:.2f} seconds")
    print("Generating movie embeddings")
    start_time = time.time()
    movies_with_embeddings = generate_embeddings_sentence_transformer(movies, fields_to_use, fine_tuned_model)
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_minutes:.2f} minutes")
    print("Generating series embeddings")
    start_time = time.time()
    series_with_embeddings = generate_embeddings_sentence_transformer(series, fields_to_use, fine_tuned_model)
    end_time = time.time()
    elapsed_time_seconds = end_time - start_time
    elapsed_time_minutes = elapsed_time_seconds / 60
    print(f"Time taken: {elapsed_time_minutes:.2f} minutes")
    return movies_with_embeddings, series_with_embeddings


def fine_tune_model(train_data, epochs=1, warmup_steps=None):
    """
    Fine-tune the SentenceTransformer model using the provided training data.

    Args:
        train_data (list): List of training examples with 'text1', 'text2', and 'label'.
        epochs (int): Number of epochs for fine-tuning.
        warmup_steps (int): Number of warmup steps for learning rate.

    Returns:
        model (SentenceTransformer): Fine-tuned SentenceTransformer model.
    """
    model = SentenceTransformer('all-mpnet-base-v2')
    train_examples = [InputExample(texts=[d["text1"], d["text2"]], label=d["label"]) for d in train_data]
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
    train_loss = losses.CosineSimilarityLoss(model=model)
    if warmup_steps is None:
        total_steps = len(train_dataloader) * epochs
        warmup_steps = max(1, int(0.1 * total_steps))
    model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=epochs, warmup_steps=warmup_steps)
    return model


def generate_embeddings_sentence_transformer(shows, fields_to_use, model):
    """
    Generate embeddings for a list of shows using specified fields.

    Args:
        shows (list): List of dictionaries, each representing a show.
        fields_to_use (list): List of field names to concatenate for embeddings.
        model (SentenceTransformer): SentenceTransformer model for generating embeddings.

    Returns:
        embeddings (np.array): Array of embeddings for each show.
    """
    show_texts = []
    for shows in shows:
        combined_text = []
        for field in fields_to_use:
            if isinstance(shows[field], list):
                combined_text.append(', '.join(shows[field]))
            else:
                combined_text.append(shows[field])
        show_texts.append(' '.join(combined_text))

    embeddings = model.encode(show_texts, show_progress_bar=True)
    for i, show in enumerate(shows):
        show['embedding'] = embeddings[i].tolist()

    return shows








