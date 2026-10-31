while true; do sudo awk -F'xff=' '{print$2}' /var/log/track-app/nginx/access.log | sort -u | sed 's/"//g'; date '+%Y.%m.%d (%H:%M:%S)';echo "-------------------";sleep 10;done
