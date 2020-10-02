FROM buildkite/puppeteer:5.2.1

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser

# COPY --chown=pptruser:pptruser ./tools /tools

# Set language to UTF8
ENV LANG="C.UTF-8"

WORKDIR /app

# Add user so we don't need --no-sandbox.
RUN mkdir /screenshots \
	# && mkdir -p /home/pptruser/Downloads \
    # && chown -R pptruser:pptruser /home/pptruser \
    # && chown -R pptruser:pptruser /usr/local/share/.config/yarn/global/node_modules \
    && chown -R pptruser:pptruser /screenshots \
    && chown -R pptruser:pptruser /app \
    # && chown -R pptruser:pptruser /tools

# Run everything after as non-privileged user.
USER pptruser

# --cap-add=SYS_ADMIN
# https://docs.docker.com/engine/reference/run/#additional-groups

ENTRYPOINT ["dumb-init", "--"]

# CMD ["/usr/local/share/.config/yarn/global/node_modules/puppeteer/.local-chromium/linux-526987/chrome-linux/chrome"]

CMD ["node", "index.js"]