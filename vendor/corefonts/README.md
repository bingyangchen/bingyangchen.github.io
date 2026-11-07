# Georgia build fonts

This directory contains Georgia 2.05 regular (`Georgia.TTF`), bold (`Georgiab.TTF`), italic (`Georgiai.TTF`) and bold italic (`Georgiaz.TTF`), extracted without modifying their contents from the original Microsoft Core Fonts for the Web installer.

Source: <https://downloads.sourceforge.net/corefonts/georgi32.exe>

Project and distribution notes: <https://corefonts.sourceforge.net/>

Source installer SHA-256: `2c2c7dcda6606ea5cf08918fb7cd3f3359e9e84338dc690013f20cd42e930301`

The source installer checksum matches Ubuntu's `msttcorefonts` 3.8.1ubuntu1 `cabfiles.sha256sums`. The TTF checksums are recorded in [SHA256SUMS](SHA256SUMS). Georgia is proprietary; the complete [Core Fonts EULA](EULA.txt) applies separately from the rest of the repository.

Ubuntu CI verifies the TTF checksums, copies the fonts into the user font directory, then refreshes the font cache. Only the generated PDF and the open Noto subset are published to the website; the Georgia files stay outside `public/` and `build/`.
