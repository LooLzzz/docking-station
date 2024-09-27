# Changelog

## [0.4.1](https://github.com/LooLzzz/docking-station/compare/v0.4.0...v0.4.1) (2024-09-27)


### Bug Fixes

* **web-ui:** fixed infinite re-rendering loop caused by 'useInterval' ([de58a1e](https://github.com/LooLzzz/docking-station/commit/de58a1eb2e408271ab1cae76657777a6850f56f2))

## [0.4.0](https://github.com/LooLzzz/docking-station/compare/v0.3.2...v0.4.0) (2024-09-27)


### Features

* **web-ui:** [#33](https://github.com/LooLzzz/docking-station/issues/33) - added services selection + "update selected" and "refresh selected" options ([617312d](https://github.com/LooLzzz/docking-station/commit/617312d47d93650c1fb86124334c68a3aae0a255))
  * Either use middle-mouse click or the checkbox which appears on hover to select/deselected a service.
  * Selected cards/services are highlighted


### Bug Fixes

* **server:** 'image_tag' sometimes not returned correctly ([617312d](https://github.com/LooLzzz/docking-station/commit/617312d47d93650c1fb86124334c68a3aae0a255))


### Miscellaneous Chores

* **web-ui:** added version number to bottom-right footer of web-ui ([27a61d3](https://github.com/LooLzzz/docking-station/commit/27a61d3168ae6c560e6d57f03379df8b551e3ef8))

* **server:** rewrote backend task creation and consumption ([617312d](https://github.com/LooLzzz/docking-station/commit/617312d47d93650c1fb86124334c68a3aae0a255))

* **build:** bump react-query to 5.56.2 ([617312d](https://github.com/LooLzzz/docking-station/commit/617312d47d93650c1fb86124334c68a3aae0a255))

## [0.3.2](https://github.com/LooLzzz/docking-station/compare/v0.3.2...v0.3.2) (2024-09-27)


### Bug Fixes

* **server:** better error logging for 'poll_compose_stack_service_update_task' ([3e53f8b](https://github.com/LooLzzz/docking-station/commit/3e53f8ba889fd92af014759abcaf365fbd2aff0f))


### Miscellaneous Chores

* **build:** created release-please config & manifest files ([525076a](https://github.com/LooLzzz/docking-station/commit/525076ad26a50effdb2cd75718fb6f7982e2ffdf))

## [0.3.1](https://github.com/LooLzzz/docking-station/compare/v0.3.0...v0.3.1) (2024-09-22)


### Bug Fixes

* stop auto_updater log spamming ([9815b73](https://github.com/LooLzzz/docking-station/commit/9815b7341891e27af04d9a766c11e11cd4458906))

## [0.3.0](https://github.com/LooLzzz/docking-station/compare/v0.2.0...v0.3.0) (2024-09-21)


### Features

* **api:** added `/api/regctl/` route with `inspect` and `digest` endpoints ([546cb58](https://github.com/LooLzzz/docking-station/commit/546cb586fa001c27e139d8fe3559818a5952e4ab))
* **web-ui:** added Accordion component to ExecutionDetails modal
* **auto-updater:** `auto_updater.py` will keep restarting until stopped manually (the modules itself is still disabled by default)

### Bug Fixes

* [#7](https://github.com/LooLzzz/docking-station/issues/7) - added new "python_on_whales__ignored_image_prefixes" option in `/app/config/settings.py` - hopefully this fixes the docker.io `KeyError` issue ([#25](https://github.com/LooLzzz/docking-station/issues/25)) ([546cb58](https://github.com/LooLzzz/docking-station/commit/546cb586fa001c27e139d8fe3559818a5952e4ab))
* **web-ui:** stopped react-query from constantly refetching to try and save on api-limit

## [0.2.0](https://github.com/LooLzzz/docking-station/compare/v0.1.0...v0.2.0) (2024-08-02)


### Features

* enable nextjs pwa ([71ee9c8](https://github.com/LooLzzz/docking-station/commit/71ee9c8e4a5521bf78382d67b5171f9bac0f39c2))

## [0.1.0](https://github.com/LooLzzz/docking-station/compare/v0.1.0...v0.1.0) (2024-08-02)


### Features

* Add cache clearing after updating compose stack service ([2c2cd7e](https://github.com/LooLzzz/docking-station/commit/2c2cd7ec8a13b7b6c6aec6972ed2a9a2a8443003))


### Bug Fixes

* query is not boolean ([507ead0](https://github.com/LooLzzz/docking-station/commit/507ead03fd8a18bd6355e4c81c6e95083ea3097e))


### Miscellaneous Chores

* release 0.1.0 ([51a6c51](https://github.com/LooLzzz/docking-station/commit/51a6c51d7a2bd0fb014e83b51f06872ffa85514e))
