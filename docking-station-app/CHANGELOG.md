# Changelog

## 1.0.0 (2024-09-27)


### Features

* Add cache clearing after updating compose stack service ([2c2cd7e](https://github.com/LooLzzz/docking-station/commit/2c2cd7ec8a13b7b6c6aec6972ed2a9a2a8443003))
* **api:** added `/api/regctl/` route with `inspect` and `digest` endpoints ([546cb58](https://github.com/LooLzzz/docking-station/commit/546cb586fa001c27e139d8fe3559818a5952e4ab))
* enable nextjs pwa ([71ee9c8](https://github.com/LooLzzz/docking-station/commit/71ee9c8e4a5521bf78382d67b5171f9bac0f39c2))


### Bug Fixes

* [#7](https://github.com/LooLzzz/docking-station/issues/7) - added new "python_on_whales__ignored_image_prefixes" option in /app/config/settings.py - hopefully this fixes the docker.io `KeyError` issue ([546cb58](https://github.com/LooLzzz/docking-station/commit/546cb586fa001c27e139d8fe3559818a5952e4ab))
* [#7](https://github.com/LooLzzz/docking-station/issues/7) added new "python_on_whales__ignored_image_prefixes" option in `/app/config/settings.py` - hopefully this fixes the docker.io `KeyError` issue ([#25](https://github.com/LooLzzz/docking-station/issues/25)) ([546cb58](https://github.com/LooLzzz/docking-station/commit/546cb586fa001c27e139d8fe3559818a5952e4ab))
* query is not boolean ([507ead0](https://github.com/LooLzzz/docking-station/commit/507ead03fd8a18bd6355e4c81c6e95083ea3097e))
* **server:** better error logging for 'poll_compose_stack_service_update_task' ([3e53f8b](https://github.com/LooLzzz/docking-station/commit/3e53f8ba889fd92af014759abcaf365fbd2aff0f))
* stop auto_updater log spamming ([9815b73](https://github.com/LooLzzz/docking-station/commit/9815b7341891e27af04d9a766c11e11cd4458906))
