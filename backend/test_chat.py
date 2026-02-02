import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_chat():
    print(f"🚀 Testing Chat API at {API_URL}")
    
    # 1. Check Health
    try:
        health = requests.get(f"{API_URL}/health")
        print(f"❤️ Health: {health.status_code}")
        print(json.dumps(health.json(), indent=2))
        
        if health.json()['documents_indexed'] == 0:
            print("⚠️ WARNING: No documents indexed! Chat will fail or mock.")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Send Chat Message
    print("\n💬 Sending message: 'What is the leave policy?'")
    try:
        response = requests.post(
            f"{API_URL}/chat",
            json={"message": "What is the leave policy?", "history": []},
            stream=True
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            return

        print("streaming response:")
        full_text = ""
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    if data['type'] == 'content':
                        print(data['data'], end="", flush=True)
                        full_text += data['data']
                    elif data['type'] == 'error':
                        print(f"\n❌ ERROR: {data['data']}")
                    elif data['type'] == 'done':
                        print("\n✅ DONE")
        
        if not full_text:
            print("\n❌ NO CONTENT RECEIVED")

    except Exception as e:
        print(f"\n❌ Request failed: {e}")

if __name__ == "__main__":
    test_chat()
