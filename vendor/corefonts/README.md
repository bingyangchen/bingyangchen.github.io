# Georgia Build Fonts

The Georgia 2.05 fonts came from the original Microsoft Core Fonts for the Web installer. The extracted fonts are byte-for-byte originals.

Source: <https://downloads.sourceforge.net/corefonts/georgi32.exe>

Project and distribution notes: <https://corefonts.sourceforge.net/>

Source installer SHA-256: `2c2c7dcda6606ea5cf08918fb7cd3f3359e9e84338dc690013f20cd42e930301`

The source installer checksum matches Ubuntu's `msttcorefonts` 3.8.1ubuntu1 `cabfiles.sha256sums`. The TTF checksums are recorded in [SHA256SUMS](SHA256SUMS). Georgia is proprietary; the complete [Core Fonts EULA](EULA.txt) applies separately from the rest of the repository.

Keep the source TTFs outside the published assets. The build embeds the fonts in the resume PDF. [CI font setup](../../.github/workflows/deploy.yml)
