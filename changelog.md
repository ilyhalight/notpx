# 1.5.0

- Added support NotPX tournament
- Added stop on tournament break
- Disabled auto upgrade by default
- Set default template id
- Set useTemplate to true by default
- Updated calc pixel id logic

# 1.4.2

- Now we are try to get template info only with authenticated account (previously, if the 1st account isn't unauthenticated, request will be rejected)

# 1.4.1

- Fix invalid file signature on request template image
- Fix auto request input login on invalid session
- Added max upgrades level (By default, each level is 999, improves to the maximum level from the notpx configuration)

# 1.4.0

- Added support drawing by template (set templateId and useTemplate to `true` in `src/config.ts`)

  When the bot is launched, as well as every 20-80 minutes (configurable), the template will be automatically updated according to the specified templateId. There may be minimal inaccuracies, because image automatic converted to pixels by Bot.

- Added update template delay
- Added support templates requests
- Moved part of important fields from `config.ts` to `.env`
- Fix OCR root path

# 1.3.1

- Fix rarely crash on try upgrade account

# 1.3.0

- Added auto renew initData every N mins
- Added auto activating accounts after Beta test
- Added randomize all delays
- Added referalId
- Improved console logging
- Updated origin
- Updated typings
- Migrated from webapp auth to telegram sessions (read [README.md](README.md))

# 1.2.2

- Added new origin and referer

# 1.2.1

- Added support of use Fast repaints by Goods
- Updated API types

# 1.2.0

- Increased the standard claim delay
- Added show repaint pixels with account info
- Added settings for ignore pixel info (currently, it isn't possible to get information about a pixel)
- Added settings for auto upgrade account
- Fix calcPixels for coords < 100
- Added Shop buy list request
- Added get NotPX config request
- Added boost and tasks request
- Updated user type

# 1.1.0

- Improved bot speed
- Added support transparent background for OCR
- Added color message about Set pixel action

# 1.0.0

- Initial version
