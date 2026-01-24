"""
Local Demucs Stem Separation Server
Flask server that runs Demucs locally for stem separation
Uploads separated stems directly to Supabase Storage
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import sys
import tempfile
import shutil
import requests
from urllib.parse import urlparse
from supabase import create_client

app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://jgzistwfzvfiikqsygpt.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_Kl5bie_hH4W9nAUQTjz8kQ_mBeJRu4F')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Output directory for separated stems
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'separated')
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/separate', methods=['POST'])
def separate():
    try:
        data = request.json
        audio_url = data.get('audioUrl')
        
        if not audio_url:
            return jsonify({'error': 'audioUrl is required'}), 400
        
        # Create temp directory for this job
        job_id = os.urandom(8).hex()
        job_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Download audio file
        print(f"Downloading audio from {audio_url}")
        try:
            response = requests.get(audio_url, timeout=60)
            print(f"Download response status: {response.status_code}")
            if response.status_code != 200:
                print(f"Download failed: {response.text[:500]}")
                return jsonify({'error': f'Failed to download audio: {response.status_code}'}), 400
        except requests.exceptions.RequestException as e:
            print(f"Download exception: {e}")
            return jsonify({'error': f'Failed to download audio: {str(e)}'}), 400
        
        # Save to temp file
        audio_ext = os.path.splitext(urlparse(audio_url).path)[1] or '.mp3'
        input_path = os.path.join(job_dir, f'input{audio_ext}')
        with open(input_path, 'wb') as f:
            f.write(response.content)
        
        print(f"Running Demucs on {input_path}")
        
        # Run Demucs using Python module instead of CLI
        result = subprocess.run(
            [sys.executable, '-m', 'demucs', '-n', 'htdemucs', '--mp3', '-o', job_dir, input_path],
            capture_output=True,
            text=True
        )
        
        print(f"Demucs stdout: {result.stdout}")
        print(f"Demucs stderr: {result.stderr}")
        print(f"Demucs return code: {result.returncode}")
        
        if result.returncode != 0:
            print(f"Demucs failed with error")
            return jsonify({'error': 'Demucs separation failed', 'details': result.stderr or result.stdout}), 500
        
        # Find output files
        input_name = os.path.splitext(os.path.basename(input_path))[0]
        stems_dir = os.path.join(job_dir, 'htdemucs', input_name)
        
        if not os.path.exists(stems_dir):
            return jsonify({'error': 'Stems output not found'}), 500
        
        # Upload stems to Supabase and return public URLs
        stems = {}
        timestamp = int(os.urandom(4).hex(), 16)
        
        for stem_name, our_name in [('vocals', 'vocal'), ('drums', 'drum'), ('bass', 'bass'), ('other', 'synth')]:
            stem_file = os.path.join(stems_dir, f'{stem_name}.mp3')
            if os.path.exists(stem_file):
                try:
                    # Read the file
                    with open(stem_file, 'rb') as f:
                        file_data = f.read()
                    
                    # Upload to Supabase Storage
                    storage_path = f'stems_{timestamp}_{our_name}.mp3'
                    print(f"Uploading {our_name} to Supabase as {storage_path}")
                    
                    result = supabase.storage.from_('assets').upload(
                        storage_path,
                        file_data,
                        file_options={'content-type': 'audio/mpeg'}
                    )
                    
                    # Get public URL
                    public_url = supabase.storage.from_('assets').get_public_url(storage_path)
                    stems[our_name] = public_url
                    print(f"Uploaded {our_name}: {public_url}")
                    
                except Exception as e:
                    print(f"Failed to upload {our_name} to Supabase: {e}")
                    # Fallback to local URL
                    dest_file = os.path.join(job_dir, f'{our_name}.mp3')
                    shutil.move(stem_file, dest_file)
                    stems[our_name] = f'http://localhost:5001/stems/{job_id}/{our_name}.mp3'
        
        # Cleanup htdemucs folder
        shutil.rmtree(os.path.join(job_dir, 'htdemucs'), ignore_errors=True)
        
        print(f"Separation complete: {stems}")
        return jsonify(stems)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/stems/<job_id>/<filename>', methods=['GET'])
def serve_stem(job_id, filename):
    """Serve separated stem files (fallback)"""
    from flask import send_from_directory
    file_path = os.path.join(OUTPUT_DIR, job_id, filename)
    if os.path.exists(file_path):
        return send_from_directory(os.path.join(OUTPUT_DIR, job_id), filename)
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print("Starting local Demucs server on http://localhost:5001")
    print("Stems will be uploaded to Supabase Storage")
    app.run(host='0.0.0.0', port=5001, debug=True)
