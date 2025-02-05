from .db_connection import get_db


def initialize_collections():
    try:
        db = get_db()
        collections = [
            'movies', 'series', 'users', 'watch_groups',
            'genres', 'opinion_threads', 'moderator_requests',
            'watch_group_chats', 'tags', 'announcements', 'embeddings'
        ]
        edge_collections = [
            'joined_group', 'his_group_chat', 'join_request',
            'follows_thread', 'his_type', 'is_about_show',
            'has_rated', 'has_embedding'
        ]
        for collection_name in collections:
            try:
                if not db.has_collection(collection_name):
                    db.create_collection(collection_name)
            except Exception as e:
                print(f"Error creating collection {collection_name}: {e}")

        for edge_collection_name in edge_collections:
            try:
                if not db.has_collection(edge_collection_name):
                    db.create_collection(edge_collection_name, edge=True)
            except Exception as e:
                print(f"Error creating edge collection {edge_collection_name}: {e}")
        return True
    except Exception as e:
        print(e)
        return False
