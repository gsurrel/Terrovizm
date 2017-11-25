# Terrovizm

All non-development information is in the [Process Book](ProcessBook/book.md).

## To do

- [x] Create Github project and pages
- [x] [Register the project](https://docs.google.com/forms/d/e/1FAIpQLSc_boP3m3UtulHvia8WgLoFYemn9yEZmuq4-glNSgGfc3O2pw/viewform)
- [x] Contact the GTD to ask for permission to publicly use the viz or it stays private
- [x] Check exactly the data available and what we keep for the Viz ([process book link](ProcessBook/book.md#dataset))
- [x] Use the [deisgn worksheets](https://design-worksheets.github.io/) mentionned in the course ([process book link](ProcessBook/book.md#designs))
- [x] Do all the mockups, blueprints and sketching required ([process book link](ProcessBook/book.md#designs))
    - [x] Initial sketch done
- [x] Python scripting to clean and **shrink** the dataset. Most textual details can probably be removed as we can give just a link to the official GTD event description and details. Scripting has the benefit of maintainability to update our dataset according to the original DB updates. ([process book link](ProcessBook/book.md#technical-setup))
- [ ] Reprocess transferred data to have nice a Javascript object to use
- [ ] Use this Readme as a process book?
- [ ] Screencast:
    - Demonstrate what you can do with your viz in a fun, engaging and impactful manner
    - Talk about your main contributions rather than on technical details
    - 2 min video not more (max +5 sec)

## Timeline (assuming Tuesdays)

- 2017-11-14 (Week 9): Proposals (via google form)
    - [x] Write and send project description
- 2017-11-28 (Week 11): Functional project prototype review
    - [x] Have an initial JSON structure. [Suggestion](scripts/suggestion.json). [Suggestion 2](scripts/suggestion2.json).
    - [x] [Script it (notebook)](scripts/DataCleaning.ipynb), [standalone-script](scripts/DataCleaning.py)
    - [ ] Create different panels on the web interface
    - [ ] Load and make data nice
    - [ ] Load it in [Crossfilter.js](https://square.github.io/crossfilter/)
    - [ ] Have a map view, with regional filtering
    - [ ] Have a timeline, with time filtering
    - [ ] Have facets, with enable/disable toggles
    - [ ] Update the other views according to the filters
- 2017-12-12 (Week 13): Final project with screencast, story telling and peer-evaluations
- 2017-12-19 (Week 14): Project presentations
