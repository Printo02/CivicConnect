import requests
import zipfile
import os

models = {
    "English": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
    "Malayalam": "https://alphacephei.com/vosk/models/vosk-model-small-ml-0.42.zip",
}

model_dir = os.path.expanduser("~/.vosk/models")
os.makedirs(model_dir, exist_ok=True)


for name, url in models.items():

    print(f"\nDownloading {name}...")

    zip_name = f"{name}.zip"
    zip_path = os.path.join(model_dir, zip_name)

    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()

        total = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

                    if total:
                        percent = downloaded * 100 / total
                        print(
                            f"\r{name}: {percent:.1f}% "
                            f"({downloaded / 1024 / 1024:.1f} MB)",
                            end=""
                        )

        print(f"\n{name} download complete.")

        print(f"Extracting {name}...")

        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(model_dir)

        os.remove(zip_path)

        print(f"✓ {name} model ready!")

    except Exception as e:
        print(f"\n✗ {name} failed: {e}")

        if os.path.exists(zip_path):
            os.remove(zip_path)


print("\n================================")
print("Vosk model setup finished")
print("================================")
print(f"Models location: {model_dir}")