# RKMS User Manual

## 1. Authentication & Account

1. Login with username/email and password — open the login page, enter user ID/email and password, submit credentials, then proceed to 2FA or the dashboard if valid.

2. Two-factor authentication (2FA) via email OTP — receive the OTP email, enter the code in the verification form, submit it, and access the system if the code is valid.

3. Remember device option to bypass repeated OTP entry — check “Remember this device” during login, allow the system to store the device fingerprint/token, then skip OTP on future login if recognized.

4. Password verification and forced password change on first login — log in with the initial password, let the system detect the required change, redirect to the password change form, enter and confirm a new password, then save and continue.

5. User registration and registration request submission — open the registration page, fill in contact, organization, and personal details, submit the registration request, and await approval if required.

6. Update user profile information — open profile settings, edit name, contact, or organization fields, save changes, and confirm the updated profile details.

## 2. Document & Folder Management

7. Upload documents to the system — open the upload dialog, select file(s) from your device, add name/description if needed, submit the upload, and wait for confirmation.

8. Create and manage folders for document organization — open folder management, click create new folder, enter folder name and optional category, save it, and edit details later if needed.

9. Organize documents into folder hierarchies — create parent folders first, then nested subfolders, move or upload documents into the correct folder, and view the folder tree structure.

10. View document details, metadata, and status — select a document, open the details panel, review metadata such as name, owner, org, approval status, and check sharing, history, or file type.

11. Download individual documents — locate the document, click download, save it locally, and open or inspect the downloaded file.

12. Download entire folders as ZIP archives — select a folder, choose “Download folder ZIP,” wait for archive generation, and save the ZIP file.

13. Soft-delete documents and folders for recycle/recovery — select the item, choose delete/recycle, confirm soft delete, and recover it from the recycle bin if needed.

14. Archive folders and their contained documents — open folder actions, choose archive, confirm the action, and archive the folder with its documents for retention.

## 3. Categorization & OCR

15. Assign categories to documents and folders — open the item detail, select a category, apply it, and save the change.

16. Perform OCR extraction on documents — upload an OCR-supported document, run OCR extraction in the backend, review extracted text metadata, and use the text for search or indexing.

17. Search documents and folders by name, metadata, or category — use the search bar or filters, enter keywords or category, view filtered results, and open the selected item.

## 4. Sharing & Access Control

18. Share documents with other users — select the document, open the share dialog, choose recipient user(s) or organization, add an optional message, and send.

19. Share folders with other organization units — select a folder, open the folder share dialog, choose target organization units, add an optional message, and save share settings.

20. View shared documents and shared folders — open the shared items view, browse incoming and outgoing shares, access shared items, and review share status and messages.

## 5. Approval Workflows

21. Submit regular document approval requests — open the approval request form, choose the document, enter a message, submit the request, and monitor its pending status.

22. Create organization-level document requests as an admin — open the admin approval request section, select the document on behalf of the organization, enter a message, and submit it for review.

23. Request document letters from a parent organization — open the parent request workflow, select the document, enter letter request details, submit it, and let the system route it to the parent organization.

24. Review, approve, deny, or escalate approval requests — open the approvals dashboard, select a pending request, review the document and message, choose approve/deny/pass higher, and confirm.

25. Track approval request statuses — view the list, see pending/approved/denied/passed_to_higher statuses, filter by status, and track decision history.

## 6. Notifications & Audit

26. View notifications for approvals, shares, and system events — open notifications, see alerts, review details, and click through to the related item.

27. Mark notifications as read and manage history — open the notification list, mark individual or all items as read, clear notifications if supported, and retain important alerts.

28. Generate and synchronize request notifications — trigger backend notification sync, refresh the list, and ensure pending requests are reflected.

29. View audit logs of user and system actions — open the audit log view, browse entries, inspect action/user/timestamp/status, and search or filter logs.

30. Filter and inspect audit history for accountability — use filters for date/user/action, select records, and review details for traceability.

## 7. User & Organization Management

31. Manage users from the admin dashboard — open user management, browse by organization, search users, and view status and roles.

32. Create new users and set user roles — open add user form, enter details and organization, choose role, save, and create the account.

33. Edit existing user details and organization assignments — open a user profile, update contact/role/org assignment, save changes, and confirm the update.

34. Deactivate/reactivate users — select the account, toggle activation, confirm the change, and monitor access updates.

35. Review and approve user creation requests — open request list, inspect submitted details, approve or deny, and notify the requester.

36. View hierarchical organization units and organization tree — open the org tree view, browse parent/child relationships, select units, and use the tree for sharing and role assignment.

37. Manage organization membership and parent-child org relationships — add or remove users from units, adjust parent org references, save structure changes, and enforce permissions.

## 8. System Administration

38. View system administration dashboard — log in as system admin, open the panel, review widgets, and navigate system tools.

39. Configure system-wide branding and theme settings — open theme settings, change primary and accent colors, update sidebar/background styling, save, and confirm.

40. Customize primary brand colors, sidebar colors, and appearance — select colors, preview, apply, save, and confirm UI updates.

41. Configure User ID formatting patterns — open ID format settings, edit patterns for users and admins, validate rules, and save.

42. Enforce organization-specific ID format rules — assign formats to org units, validate when creating users, confirm enforcement, and update rules as needed.

43. Access system admin-level control of configuration — manage users, audit logs, and settings, adjust global behavior, audit actions, and maintain governance.

## 9. Role-Based Routing & Access

44. Support role-based access control — regular users use user dashboards, admins access admin tools, system admins access settings, and permissions are enforced per role.

45. Route users to role-specific dashboards after login — authenticate the user, detect role_type, redirect to the correct dashboard, and show role-based tools.

46. Provide admin-level oversight of documents, approvals, and users — admin dashboard aggregates approvals, shares, and user data, showing org-level controls and actions.

47. Provide system admin-level control of configuration and ID formats — system admin dashboard shows config panels, allows global changes, and ensures consistent rules.

48. Maintain hierarchical permissions and organization-level controls — parent orgs receive requests from child orgs, org admins manage their unit, and access respects ownership and shares.

---

This file contains the full RKMS user manual with steps for each functionality. You can download it directly from the workspace as `docs/user_manual.md`.
