# Thai folklore and rural art audit — 2026-10-09

The previous art prompts specified Thai one-baht horror comics but did not document per-character source checks. A style prompt is not folklore research. The current roster mixes documented folk ghosts, generic spirits, sacred/religious figures and original game characters. The v1.0.25 implementation below replaces these sprites and scenes and provides per-character provenance.

## Verified sources

- Department of Cultural Promotion, “เล่าสู่กันฟัง...เรื่อง ผี! ผี! ผี!”: https://www.culture.go.th/culture_th/ewt_news.php?filename=i&nid=5339 . Describes Krasue, Krahang, Pop, Tai Hong/Tai Thang Klom, several meanings of Phrai, Phong, Khamot, Kong Koi and tree spirits. Krahang uses winnowing baskets and rice-pounding implements; a generic flying monster does not establish this identity. Different versions of Phrai exist; the water-spirit version must appear in a water setting.
- Princess Maha Chakri Sirindhorn Anthropology Centre, Thai Bueng: https://ethnicity.sac.or.th/ethnic_detail?EID=178 . Documents local Pop possession, tree spirits, Krasue, water spirits/Phrai, Tai Hong and benevolent ancestral spirits. These are accounts of belief, not evidence of real supernatural beings.
- SAC Thailand Cultural Encyclopedia, “อุปคุต, พระ (พุทธสาวก)”: https://db.sac.or.th/thailand-cultural-encyclopedia/detail.php?id=13964 . Phra Upakut is a Buddhist saint/disciple and protector; treating him as a hostile Thai ghost misclassifies his role.
- SAC Covid-19 Digital Archive, “ข่าวลือ ข่าวลวง เทคโนโลยีสื่อสาร และความตื่นกลัวทางสังคม”: https://covidarchives.sac.or.th/ข่าวลือ-ข่าวลวง-เทคโนโลยี/ . Discusses belief/rumours about Phi Mae Mai and red cloth protection. Use as evidence of the belief's cultural presence, not a claim that deaths are caused by ghosts.

## Problems found before this pass

- Original night bosses คนแบกหัว, เงาระฆังร้าง, เจ้าดงรากผี, นางเฝ้าถ้ำ and เจ้าไร้เศียร were created for the game. Do not describe them as documented traditional Thai ghost species.
- ผีกินหัว and the heads-missing-before-dawn premise are the user's original game fiction. Preserve that story and label its origin accurately in developer documentation.
- พระอุปคุต is not a hostile ghost. พญานาค, พระยามัจจุราช and guardian giants likewise require role-specific treatment; Thai cultural origin alone does not make a figure a hostile folk ghost. เทพอักษร and other unsupported invented names require review.
- Correct the displayed spelling กะหัง to กระหัง when that roster is revised. Review ผีตายโหง versus ผีตายทั้งกลม: these are different categories, not interchangeable file names.

## Implemented researched direction — v1.0.25

Use clearly identifiable Pop, Krasue, Krahang, Pret, Tanee/Takhian, Tai Hong, water Phrai, Kong Koi and Mae Mai; retain regional variations explicitly. Give each boss a separate documented ghost identity and an individual Thai village backstory. Keep the ultimate ผีกินหัว as game-original. Do not solve this with name changes pasted onto incompatible pictures.

The current mountain-trail composition resembles an East Asian fantasy cliff path. The reviewed temple-gate image has Thai roof/naga/chedi elements; it should not be called Chinese merely because it is old or elaborate. The overall journey needs clearer rural Thai context and less monumental fantasy staging.

Art direction: raised wooden houses, woven bamboo walls, ordinary village wat, simple temple bell, banana/takhian/banyan groves, rice fields, dirt paths, bamboo footbridges, forest streams, a rain-darkened forested mountain trail, cave mouth and a modest cave shrine. A supernatural late-game space should distort these Thai local objects rather than introduce a palace or stone throne. Preserve fifteen distinct destinations, eight rest scenes, and the ultimate arena. Use rough black ink, flat faded ochre/olive/brick-red printing and readable silhouettes matching the established one-baht comic style.

For each replacement, record the specific source, region/version, visual identifiers and what gameplay fiction was added. Review artwork as an asset; no automated game screenshot capture is required.

## UI repairs in this follow-up

Transparent torn-paper assets were backed by full rectangular cream Views. Remove that backing for occupationPage, grayCard and hudPaper, affecting hand cards, reward/upgrade details, victory, ending and primary buttons. The asset remains the paper surface. Replace the generic “ยืนยันวิชา” button with the selected action, including “เลือกการ์ดที่จะสละ”; the next card picker retains its explicit “สละใบนี้” confirmation.

## Implementation

All 34 enemy identities now have a named species, regional context, source link, separate game backstory, visual identifiers and matching replacement art. This includes ordinary ghosts, five night bosses and the game-original ultimate. The map and battle expose “ที่มาของผี”; victory also resolves canonical names for older saves. Enemy IDs and combat statistics remain stable. Tanee is documented as a guardian belief; its hostile role is attributed explicitly to the game curse.

Additional sources: Fine Arts Department / Trang National Library, “สารพัด ผี” (https://www.finearts.go.th/nlttrang/view/36983-สาระน่ารู้เรื่อง-สารพัด--ผี-); Thai Junior Encyclopedia on northern Phi Phong (https://saranukromthai.or.th/oldchild/3156); Thai Film Archive on Mae Nak (https://www.fapot.or.th/main/heritage/view/36). Source accounts vary by region; the descriptions are cultural beliefs, not claims of supernatural fact.

The 24 new journey environments use rural Thai houses, ordinary wat, rice fields, banana/forest groves, footbridges and caves. Every base player card and named fusion has a distinct wired image; procedural fusions compose their parent images. All 16 blessings have dedicated imagery shared across screens. Asset review does not capture the game. See `HANDOFF-battle-ui-backlog-v22.md` for release validation.
