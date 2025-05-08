
# TODO List

## Completed

- [x] Finish testing controllers
- [x] Add file upload functionality (for term.csv)
- [x] Backend API for file upload
- [x] Frontend interface for file upload
- [x] Frontend interface module rename
- [x] Frontend interface for course copies
- [x] Backend API for course copies
- [x] Dont allow copy of existing course

## In Progress

- [ ] Remove logout

- [x] Frontend interface for scorm generation
  - [x] Fix form alignment
  - [x] Fix theme buttons
  - [x] Fix settings spacing
  - [x] Fix score inputs
  - [x] Fix tracking option alignment
  - [x] Fix scorm generation button
  - [x] Fix textarea alignment
- [ ] Generate scorm zip file
- [ ] Add "uppercase" and "lowercase" options to scorm title generation

- [x] Implement refresh token

- [x] Set term in copied course
- [x] Clean up course copies controller/routes
- [x] Admin interface for updating current term

- [x] Need tests for:
  - [x] User Controller
  - [x] Auth Controller 
  - [x] Content Controller
  - [x] Course Controller
  - [x] Term Controller

- [x] Routes that need documentation:
  - [x] /:courseId/contents/:contentId/scorms
  - [x] /:courseId/contents/scorms/:scormId/completed
  - [x] /:courseId/contents/:moduleId/scorms/add-link
  - [x] /terms/current-id

### Future

- [ ] Only admins can upload term .csv
- [ ] Only admins can access the api docs