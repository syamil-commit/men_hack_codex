FROM nginx:stable-alpine

LABEL org.opencontainers.image.title="MenCare Patient Demo" \
      org.opencontainers.image.description="Static patient experience demo for MenCare" \
      org.opencontainers.image.source="https://github.com/syamil-commit/men_hack_codex"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
