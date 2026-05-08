# Route Optimization

This document outlines the key objectives for the Web Application designed to address the challenges faced by Medical Sales Representatives (MSRs) during their visits to Healthcare Professionals (HCPs) throughout the sales cycle.

## Goal

The primary goal is to optimize the daily route for visiting target HCPs.

## Background Information

Medical Sales Representatives can utilize their HCPs panel to identify the best route to follow each day. This panel provides fields for the HCPs' addresses, geospatial information (longitude and latitude), and a visitation schedule.

The representatives use their personal vehicles to travel between locations.

## Expected Functionality

The Web App will analyze the HCPs panel and recommend an optimized route for the day, ensuring adherence to the required number of daily calls (targets). For instance, when a Medical Sales Representative starts their day by opening the Web App, the app detects a new business day and displays a dashboard with insights on previously visited HCPs. The representative can then click to start an optimized route, prompting the system to suggest a maximum of 10 targets that have either not been visited or are due for a visit based on frequency.

The Web App will use the addresses of the 10 suggested HCPs to determine the nearest locations based on the representative's current position. If the representative approves the suggested route, it will be saved and displayed sequentially on both a list and a map.

Once the representative arrives at each target location and spends a configured amount of time, the system will display the next point in the route. This process will continue until all locations on the route have been visited. There is no manual confirmation needed for visits; the system automatically starts a timer upon the representative's arrival and tracks the time spent at each location.

The suggested targets will always evaluate the best route based on HCP addresses, geospatial information, schedule, and the promotional grid to facilitate the completion of the sales cycle. The promotional grid defines the priority for visiting HCPs, which may vary by tier, coverage, and frequency. This grid is integral to the workflow, ensuring that all suggestions are in alignment.

## Edge Cases

If the representative is dissatisfied with the suggested route, they can manually create an alternative. However, they cannot include more HCPs than permitted for the day.

The Web App also allows for real-time adjustments. For example, if the representative has completed 2 points on the route but realizes that the next location is inaccessible, they can request a new plan based on their current location. The original suggested route will be saved (for auditing purposes) but hidden from view, and new options will be displayed.

If the representative diverges from the suggested route, the Web App will continue to recommend the configured plan until they choose to update or create a new route. Representatives can also include breaks in their planned route for personal matters or lunch.

If the time spent at a visit is less than the configured duration, an alert will appear in the user interface, prompting the representative to confirm they are leaving early and to provide a note. While this confirmation is not mandatory, it can be completed later. The process of starting or stopping a visit is managed via geofencing, which detects movement of at least 50 meters between route points.

If the time spent at an HCP is equal to or greater than the configured visit duration, that HCP will be marked as visited. 

If multiple HCPs are located in the same building, the system will estimate the expected visit time based on the predefined duration. 

Should the representative be unable to complete the suggested list, the remaining contacts will automatically be added to the following day's plan.