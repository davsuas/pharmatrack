# Four-role auth model: Admin, DM, PM, MSR

The system uses four distinct roles with non-overlapping ownership: Admin (system setup, user provisioning, Cycle creation), DM (territory KPIs, team monitoring, Route configuration), PM (Campaigns and Promotional Grids), MSR (field execution).

A three-role model (DM, PM, MSR) was considered, with DM absorbing system administration. Rejected because DM and PM are peers with different domains — assigning system setup to DM would give DMs implicit authority over PM-owned data (Campaigns, Grids) and create ambiguous RLS boundaries in Supabase. A dedicated Admin role keeps each domain clean and simplifies row-level security policies.
