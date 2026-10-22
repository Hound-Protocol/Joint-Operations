/* Hound Protocol · Joint Operations — site application
 *
 * Data sources
 *   data/config.json     project name, version, repo, links, logo
 *   data/servers.json    session list (empty until the session service exists)
 *   data/mods.json       reviewed mods: compatible and with known issues
 *   data/docs.json       documentation library manifest
 *   data/contracts.json  planned contracts, used until GitHub issues carry the "contract" label
 *   data/briefing.json   text for the About page (route #/briefing)
 *   data/devlog.json     manual dev log entries
 *   data/records.json    signed contributor records (tools/records.py), checked on the Verify page
 *   data/records-key.json public keys for those records
 *   data/guides.json     handbook index (tools/guides_index.py), shown on the Guides page
 *   GitHub API           releases, contract issues and commits, read live
 *
 * Hooks (for the future session service or tools)
 *   window.JO.setServers(list)   replace the session list
 *   window.JO.setMods({compatible, issues})
 *   window.JO.setDevlog(entries) replace the manual dev log entries
 *   window.JO.refresh()          clear cached GitHub data and reload the current view
 */
