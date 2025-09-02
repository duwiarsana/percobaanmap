#!/usr/bin/env python3
"""
Modular and reusable script to capture screenshots of websites using Browser MCP.
Usage: python screenshot_example.py [--websites-file FILE] [--save-dir DIR]
"""

import subprocess
import json
import base64
import os
import time
import argparse
from pathlib import Path
from typing import List, Optional
from contextlib import contextmanager

class MCPClient:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None

    def start(self):
        self.process = subprocess.Popen(
            ['npx', '@browsermcp/mcp@latest'],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, cwd=os.getcwd()
        )

    def send(self, message: dict):
        if self.process:
            self.process.stdin.write(json.dumps(message) + '\n')
            self.process.stdin.flush()

    def receive(self) -> Optional[dict]:
        if self.process:
            line = self.process.stdout.readline()
            return json.loads(line.strip()) if line else None
        return None

    def initialize(self):
        self.send({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05", "capabilities": {},
                "clientInfo": {"name": "mcp-screenshot-client", "version": "1.0"}
            }
        })
        return self.receive()

    def list_tools(self):
        self.send({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        return self.receive()

    def navigate(self, url: str, msg_id: int):
        self.send({
            "jsonrpc": "2.0", "id": msg_id, "method": "tools/call",
            "params": {"name": "browser_navigate", "arguments": {"url": url}}
        })
        return self.receive()

    def screenshot(self, msg_id: int):
        self.send({
            "jsonrpc": "2.0", "id": msg_id, "method": "tools/call",
            "params": {"name": "browser_screenshot", "arguments": {}}
        })
        return self.receive()

    def close(self):
        if self.process:
            self.send({"jsonrpc": "2.0", "id": 999, "method": "shutdown"})
            self.process.terminate()
            self.process.wait()

@contextmanager
def mcp_session():
    client = MCPClient()
    client.start()
    client.initialize()
    client.list_tools()
    try:
        yield client
    finally:
        client.close()

def load_websites(file_path: Path) -> List[str]:
    try:
        with open(file_path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading websites: {e}")
        return []

def save_screenshot(data: str, save_path: Path):
    try:
        Path(save_path).write_bytes(base64.b64decode(data))
        print(f"Saved: {save_path}")
    except Exception as e:
        print(f"Save error: {e}")

def capture_screenshot(client: MCPClient, url: str, idx: int, save_dir: Path):
    print(f"Processing {url}...")
    client.navigate(url, 3 + idx * 2)
    time.sleep(3)
    response = client.screenshot(4 + idx * 2)
    if response and 'result' in response:
        for item in response['result'].get('content', []):
            if item.get('type') == 'image':
                filename = url.replace('https://', '').replace('://', '').replace('/', '_').replace('.', '_') + '.png'
                save_screenshot(item['data'], save_dir / filename)
                break

def main():
    parser = argparse.ArgumentParser(description="Capture screenshots of websites.")
    parser.add_argument('--websites-file', type=Path, default=Path(__file__).parent / 'websites.json',
                        help="JSON file with list of websites")
    parser.add_argument('--save-dir', type=Path, default=Path.home() / "Documents" / "screenshots",
                        help="Directory to save screenshots")
    args = parser.parse_args()

    websites = load_websites(args.websites_file)
    if not websites:
        return

    args.save_dir.mkdir(parents=True, exist_ok=True)

    with mcp_session() as client:
        for idx, url in enumerate(websites):
            capture_screenshot(client, url, idx, args.save_dir)

if __name__ == "__main__":
    main()
