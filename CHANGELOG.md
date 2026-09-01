# Changelog

## [3.2.2](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.2.1...v3.2.2) (2026-08-20)


### Bug Fixes

* **main:** only force software rendering in headless Docker dev env ([f647fcb](https://github.com/SK-EMBaRCLab/batss-app/commit/f647fcb5795ac891e1b09e640a79a1c92060a94a))
* **simulation:** don't crash the view when the IPC run call rejects ([1255624](https://github.com/SK-EMBaRCLab/batss-app/commit/1255624c26a02189acac7d1d405b68c6bd8c9940))


### Performance Improvements

* **runtime:** batch available.packages() calls by unique repo ([eb2a82f](https://github.com/SK-EMBaRCLab/batss-app/commit/eb2a82f0a91ca5875d03a086276e84da759a4e07))
* **runtime:** share a single RManager instance across the app ([3679de0](https://github.com/SK-EMBaRCLab/batss-app/commit/3679de0a839f53948d10acf9c32f3ce1ae8ad11f))
* **settings:** cache settings in memory and debounce window bounds saves ([b1f895f](https://github.com/SK-EMBaRCLab/batss-app/commit/b1f895f41842afbc61bc441c96cfb4d2af8eda5f))

## [3.2.1](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.2.0...v3.2.1) (2026-08-20)

### Bug Fixes

- improve theme colors and contrast and overall style ([a33bf74](https://github.com/SK-EMBaRCLab/batss-app/commit/a33bf7418850c79b2e3602f7ffb0d44314b38c6a))

## [3.2.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.1.0...v3.2.0) (2026-08-19)

### Features

- **runtime:** Add ability to check for R package versions and update to latest ([dd63884](https://github.com/SK-EMBaRCLab/batss-app/commit/dd638844e0e239cdfe053797144a7ebd75421bf3)), closes [#26](https://github.com/SK-EMBaRCLab/batss-app/issues/26)

## [3.1.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.0.2...v3.1.0) (2026-08-19)

### Features

- add validation and support for continuous outcome type simulation ([9cb9674](https://github.com/SK-EMBaRCLab/batss-app/commit/9cb9674631bdb14e924b4f30a04e52558ea8ccf6))
- add validation to simulation form ([10c204e](https://github.com/SK-EMBaRCLab/batss-app/commit/10c204e7e939801250a18349677b2204d749f0b1))
- **results:** add a results table and cleanup some components ([907e6ec](https://github.com/SK-EMBaRCLab/batss-app/commit/907e6ecf277ecda1ddd7a37d7169be3f258ba84a)), closes [#37](https://github.com/SK-EMBaRCLab/batss-app/issues/37) [#36](https://github.com/SK-EMBaRCLab/batss-app/issues/36)

## [3.0.2](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.0.1...v3.0.2) (2026-08-11)

### Bug Fixes

- bug on dashboard when its a new design with undefined input ([97a0910](https://github.com/SK-EMBaRCLab/batss-app/commit/97a09107c10ca6c75d6b6152b6989459b487a967))

## [3.0.1](https://github.com/SK-EMBaRCLab/batss-app/compare/v3.0.0...v3.0.1) (2026-08-10)

### Bug Fixes

- improve stepper and form layout ([91861f9](https://github.com/SK-EMBaRCLab/batss-app/commit/91861f999e35d3cc2a50e1bde47b23f0b0391b2c))
- scenario with null data causing table to crash ([a4bc042](https://github.com/SK-EMBaRCLab/batss-app/commit/a4bc042331a5b7d758c4fd883e2e5c036b2f1550))

## [3.0.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v2.1.0...v3.0.0) (2026-08-10)

### ⚠ BREAKING CHANGES

- rebuild results and simulation to match updated input and output model

### Features

- rebuild results and simulation to match updated input and output model ([cd6b765](https://github.com/SK-EMBaRCLab/batss-app/commit/cd6b7654bb729db3234d9a49f150a6d50bbb51a2))

## [2.1.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v2.0.0...v2.1.0) (2026-08-06)

### Features

- add ability to check if saved or not and prompt user with dialog to save ([f7941d1](https://github.com/SK-EMBaRCLab/batss-app/commit/f7941d141ea17d4777e9795789d86f2e3a698cfe))
- add keyboard shortcuts and commands ([8188864](https://github.com/SK-EMBaRCLab/batss-app/commit/818886426fd3796d7060acccbc0415ad13f36670))
- added error boundaries and fixed save file so that input is stored per result as well ([ae12890](https://github.com/SK-EMBaRCLab/batss-app/commit/ae12890b4c9fe94b1eb2657af8e243d93dd986eb))

### Bug Fixes

- remove console logs and fix bug in results page layout ([75df8eb](https://github.com/SK-EMBaRCLab/batss-app/commit/75df8eb135e1f624272b0434b159a36e0bb6f043))

## [2.0.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.5...v2.0.0) (2026-08-05)

### ⚠ BREAKING CHANGES

- add design concept that can have multiple simulation results. renamed from batss to more generic simulation for files.

### Features

- add ability to export and save chart as png ([b646539](https://github.com/SK-EMBaRCLab/batss-app/commit/b646539ab500c41e36cd2485c3aab527db8177b6))
- add chart options ([95e56ca](https://github.com/SK-EMBaRCLab/batss-app/commit/95e56ca7ef8ebf0266c037e0d23ef4852d7b10e1))
- add design concept that can have multiple simulation results. renamed from batss to more generic simulation for files. ([0765352](https://github.com/SK-EMBaRCLab/batss-app/commit/0765352e670fc6a35449e6b83f1f2a8657f1206b))

## [1.3.5](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.4...v1.3.5) (2026-07-28)

### Bug Fixes

- remove debug statements ([30cdf96](https://github.com/SK-EMBaRCLab/batss-app/commit/30cdf96cf0a6cf1f4de9ca692af418f1ff3a23ec))

## [1.3.4](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.3...v1.3.4) (2026-07-28)

### Bug Fixes

- remove rtools ([2cd53d7](https://github.com/SK-EMBaRCLab/batss-app/commit/2cd53d783287a711d232e2677e3b467ee5e1db52))

## [1.3.3](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.2...v1.3.3) (2026-07-28)

### Bug Fixes

- pkg_type bug ([f7cfd92](https://github.com/SK-EMBaRCLab/batss-app/commit/f7cfd926f91751c0f2ba5d71defc0d1fe16fd453))

## [1.3.2](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.1...v1.3.2) (2026-07-28)

### Bug Fixes

- INLA install on windows ([e5b16e1](https://github.com/SK-EMBaRCLab/batss-app/commit/e5b16e1082892dced45cebee4de22820401fe599))

## [1.3.1](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.3.0...v1.3.1) (2026-07-28)

### Bug Fixes

- add debug statements ([39caefb](https://github.com/SK-EMBaRCLab/batss-app/commit/39caefb82eae368d25664c3f930671ddaf1fe56c))

## [1.3.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.16...v1.3.0) (2026-07-27)

### Features

- add banner and dont block gui on failed install ([09a03d7](https://github.com/SK-EMBaRCLab/batss-app/commit/09a03d7b5f5ab62569ad2f10a683055d9c7c27a1))

## [1.2.16](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.15...v1.2.16) (2026-07-27)

### Bug Fixes

- add debug statement ([4cae3ff](https://github.com/SK-EMBaRCLab/batss-app/commit/4cae3ff473199ad7b22bcd4c06299029b674c0da))

## [1.2.15](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.14...v1.2.15) (2026-07-27)

### Bug Fixes

- removed unused import causing failure in linting ([65ae07a](https://github.com/SK-EMBaRCLab/batss-app/commit/65ae07a58c6bd9c1fcde03fc65ebb58767692f47))

## [1.2.14](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.13...v1.2.14) (2026-07-27)

### Bug Fixes

- bug in Rtools detection ([a804ccd](https://github.com/SK-EMBaRCLab/batss-app/commit/a804ccd81c8097101ca3baa39e84aac42a177978))

## [1.2.13](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.12...v1.2.13) (2026-07-27)

### Bug Fixes

- update finding rtools ([24f9d0f](https://github.com/SK-EMBaRCLab/batss-app/commit/24f9d0f73caed9f2bb81d84cc4041931fa76b2f0))

## [1.2.12](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.11...v1.2.12) (2026-07-27)

### Bug Fixes

- issue with cp not on path ([e5995df](https://github.com/SK-EMBaRCLab/batss-app/commit/e5995df897c383db7203aad741c53a7f61f547e3))

## [1.2.11](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.10...v1.2.11) (2026-07-27)

### Bug Fixes

- bug related to INLA package and R version ([9f05f1a](https://github.com/SK-EMBaRCLab/batss-app/commit/9f05f1a6272b2da33fe4683eedaa18bc3419dba2))

## [1.2.10](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.9...v1.2.10) (2026-07-27)

### Bug Fixes

- found bug related to windows line endings ([81cf27b](https://github.com/SK-EMBaRCLab/batss-app/commit/81cf27bd3bc3a6e10a7c34ee063632da27662f81))

## [1.2.9](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.8...v1.2.9) (2026-07-27)

### Bug Fixes

- more debugging ([db38829](https://github.com/SK-EMBaRCLab/batss-app/commit/db3882900fa47acb74323cc2b2f0a58d4c82f072))

## [1.2.8](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.7...v1.2.8) (2026-07-27)

### Bug Fixes

- more debugging and attempted fixes ([1845daf](https://github.com/SK-EMBaRCLab/batss-app/commit/1845dafb399a523ac4595492489a0807560bd652))

## [1.2.7](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.6...v1.2.7) (2026-07-27)

### Bug Fixes

- more debugging of install isue ([936f73b](https://github.com/SK-EMBaRCLab/batss-app/commit/936f73bc825e2e1cf9ff9a7fb9fb7376b995494d))

## [1.2.6](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.5...v1.2.6) (2026-07-27)

### Bug Fixes

- debugging install issue ([cfdc4dd](https://github.com/SK-EMBaRCLab/batss-app/commit/cfdc4ddd5c8656854a61f0458f3cf2b5eb3e9666))

## [1.2.5](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.4...v1.2.5) (2026-07-27)

### Bug Fixes

- issue related to installing packages on windows ([dbb4500](https://github.com/SK-EMBaRCLab/batss-app/commit/dbb45002d044f08c38bdb4a013cd4833b1488804))

## [1.2.4](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.3...v1.2.4) (2026-07-23)

### Bug Fixes

- issue with not finding rscript on windows path ([c141925](https://github.com/SK-EMBaRCLab/batss-app/commit/c141925f5329da5cd83c11d56b89ca8bc5e2575c))

## [1.2.3](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.2...v1.2.3) (2026-07-23)

### Bug Fixes

- cleanup some code and small bugs and improvements to form ([7dd7de7](https://github.com/SK-EMBaRCLab/batss-app/commit/7dd7de700abfb2f2bff6737e3cdba7094f4be0be))

## [1.2.2](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.1...v1.2.2) (2026-07-22)

### Bug Fixes

- issue with not finding R on mac and windows ([ffede7a](https://github.com/SK-EMBaRCLab/batss-app/commit/ffede7abfdb2c6636ae2307c443bf6c07c301516))

## [1.2.1](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.2.0...v1.2.1) (2026-07-22)

### Bug Fixes

- build for mac related to damaged dmg ([e13693f](https://github.com/SK-EMBaRCLab/batss-app/commit/e13693f7720ae2c0bb4df7b0b56ac499923b85cf))

## [1.2.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.1.0...v1.2.0) (2026-07-22)

### Features

- add ability to save in settings path ([c64381a](https://github.com/SK-EMBaRCLab/batss-app/commit/c64381a6169de04ddb942badf11955185e5c5b00))
- add results page and save load functionality ([24dc393](https://github.com/SK-EMBaRCLab/batss-app/commit/24dc393d9bfa92db24b158b70ec9f790a38b62db))

## [1.1.0](https://github.com/SK-EMBaRCLab/batss-app/compare/v1.0.0...v1.1.0) (2026-07-21)

### Features

- add results output table and chart ([fc82505](https://github.com/SK-EMBaRCLab/batss-app/commit/fc82505b09ebf643e6bcf11f6a4516be6b46f0d1))

### Bug Fixes

- typescript eslint errors ([447fd2f](https://github.com/SK-EMBaRCLab/batss-app/commit/447fd2fe04ca56cc267510045764365d23e900da))
