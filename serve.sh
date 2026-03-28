#!/bin/bash
# Start the One Up game server
# Access from your phone: http://<your-machine-ip>:8080

PORT=${1:-8080}
DIR="$(dirname "$0")/src"

echo "============================================"
echo "  ONE UP - Puzzle Game Server"
echo "============================================"
echo ""
echo "  Local:   http://localhost:$PORT"

# Show all IPs for phone access
for ip in $(hostname -I 2>/dev/null || ifconfig 2>/dev/null | grep 'inet ' | awk '{print $2}'); do
    echo "  Network: http://$ip:$PORT"
done

echo ""
echo "  Open any of the Network URLs on your phone"
echo "  Press Ctrl+C to stop"
echo "============================================"

cd "$DIR" && python3 -m http.server "$PORT" --bind 0.0.0.0
