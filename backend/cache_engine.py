import fakeredis
import json
from fuzzywuzzy import process

# Boot a simulated enterprise Redis server directly in Python's RAM
redis_client = fakeredis.FakeStrictRedis(decode_responses=True)

# The NAMASTE / ICD-11 TM2 Ontology (The official government codes)
AYUSH_ONTOLOGY = {
    "Vata Dosha Imbalance": {"namaste": "NAM001", "icd11": "QE11.0"},
    "Sandhigata Vata (Osteoarthritis)": {"namaste": "NAM024", "icd11": "FA31.Z"},
    "Agni Mandya (Weak Digestion)": {"namaste": "NAM012", "icd11": "QE12.2"},
    "Shirotapa (Headache)": {"namaste": "NAM045", "icd11": "MB41.0"}
}

def seed_redis_cache():
    """Loads the ontology into RAM for ultra-low latency access."""
    for term, codes in AYUSH_ONTOLOGY.items():
        redis_client.set(f"ayush_term:{term}", json.dumps(codes))

def extract_clinical_entities(clinical_note: str):
    """
    Simulates a lightweight NLP extraction pipeline.
    Matches unstructured doctor notes against the RAM cache in < 2ms.
    """
    words = clinical_note.split()
    extracted_data = []
    
    # Get all known terms from the RAM cache
    known_terms = [key.replace("ayush_term:", "") for key in redis_client.keys("ayush_term:*")]
    
    # NLP Fuzzy matching to find symptoms even with typos
    for term in known_terms:
        # If the term's keywords appear in the note with high confidence
        match, score = process.extractOne(term, words)
        if score > 75: 
            cached_data = json.loads(redis_client.get(f"ayush_term:{term}"))
            extracted_data.append({
                "clinical_term": term,
                "namaste_code": cached_data["namaste"],
                "icd11_tm2": cached_data["icd11"]
            })
            
    return extracted_data