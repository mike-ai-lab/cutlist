### **Instructions for Developer: PARAMETRIX Extension Improvements**

**Goal:** Enhance the core nesting intelligence, improve user feedback, and provide more flexible configuration.

---

#### **1. Core Nesting Algorithm Improvement (Increased "Intelligence")**

This is the most impactful improvement for material optimization. The current `find_best_position` uses a simple "first fit, bottom-left scan," which is functional but not optimal.

*   **File(s) Affected:** `board.txt`, potentially `nester.txt`
*   **Task:** Replace the current `Board#find_best_position` method with a more sophisticated 2D bin packing algorithm.
*   **Details:**
    *   **Current Limitation:** The `step(10)` and simple iteration in `find_best_position` are greedy and do not efficiently utilize irregular empty spaces or "holes" left by larger parts.
    *   **Recommended Approach (Maximal Rectangles / Skyline Algorithm):**
        1.  **Maintain a list of available empty rectangles (bins/holes):** Instead of scanning every 10mm, track the unoccupied rectangular areas on the board. Initially, this list will contain just one rectangle: the entire board.
        2.  **When placing a part:** Iterate through the available empty rectangles.
            *   Find an empty rectangle where the current part (with kerf) can fit.
            *   Prioritize a fit that minimizes the new empty rectangles created or optimizes for future placements (e.g., smaller remaining area, fitting into a "corner").
        3.  **After placing a part:** The empty rectangle where the part was placed will be "consumed." It will then be split into new, smaller empty rectangles representing the remaining space around the placed part. Add these new rectangles to the available list.
        4.  **Sorting:** Keep sorting `remaining_parts` by decreasing area (FFD) as it's a good heuristic.
    *   **Expected Outcome:** Significantly better material utilization, reduced waste, and more compact cutting layouts.
    *   **Complexity:** This is a substantial algorithmic change. It will require a new data structure (e.g., a custom `Rect` class or similar) to manage available spaces.

---

#### **2. Enhanced User Feedback & Progress Indicators**

For larger models, analysis and nesting can take time. Users need visual feedback.

*   **File(s) Affected:** `model_analyzer.txt`, `nester.txt`, `main_dialog.html`/`main_dialog.js` (for UI integration)
*   **Task:** Implement a progress bar or status messages for long-running operations.
*   **Details:**
    *   **In Ruby (`ModelAnalyzer` & `Nester`):**
        *   Utilize `UI.start_timer` and `UI.messagebox` sparingly, or better, `Sketchup::set_status_text` for simple text updates.
        *   For more granular progress, consider using `Sketchup::send_action` or `UI::WebDialog#execute_script` to send progress updates (e.g., percentage complete, current step) back to the web dialog.
    *   **In Web Dialog (`main_dialog.html`/`main_dialog.js`):**
        *   Create a dedicated UI element (e.g., a progress bar, status text area) that is updated by the Ruby code.
        *   Show/hide this element as operations start and complete.
    *   **Key Operations to Monitor:**
        *   `ModelAnalyzer#extract_parts_from_selection` (e.g., "Analyzing model... [X/Y components processed]").
        *   `Nester#optimize_boards` (e.g., "Nesting parts... [X% complete]", "Processing material: MDF").

---

#### **3. Flexible Stock Material Configuration**

Allow users to define multiple stock sizes per material and intelligent selection.

*   **File(s) Affected:** `config.rb`, `nester.txt`, `main_dialog.html`/`main_dialog.js` (for UI to define stock)
*   **Task:**
    1.  **Extend `Config`:** Allow users to define a list of available stock dimensions for each material (e.g., `MDF: [{width: 2440, height: 1220}, {width: 1220, height: 1220}]`).
    2.  **Modify `Nester`:** When starting to nest parts for a specific `material`:
        *   Instead of picking a single default stock size, iterate through the *available* stock sizes for that material.
        *   Implement a strategy to select the "best" stock board:
            *   **Option A (User Choice):** Allow the user to specify a preferred stock size (e.g., via dropdown in UI).
            *   **Option B (Automated):** Automatically try to fit parts onto the smallest possible stock board that can contain at least one of the largest parts, or perhaps multiple smaller parts efficiently.
            *   **Option C (Hybrid):** Try fitting on various stock sizes and choose the one that yields the least waste or fewest boards.
*   **Details:** This will make the extension more adaptable to different workshop stock inventories. The `stock_materials_config` in `nester.txt` will need to be updated to handle an array of dimensions rather than just one.

---

#### **4. Visualize Nested Layouts in SketchUp**

Currently, the output is data. Visualizing the cut sheets directly in SketchUp would be invaluable.

*   **File(s) Affected:** New `BoardVisualizer` class/module, `commands.rb` (to trigger visualization), `main_dialog.js` (for button)
*   **Task:** Create SketchUp geometry representing the nested boards and parts.
*   **Details:**
    *   **New `BoardVisualizer` Class:**
        *   Input: An array of `Board` objects (from `Nester#optimize_boards`).
        *   Output: Create SketchUp `Group` or `ComponentInstance` entities.
        *   For each `Board`: Create a rectangular face representing the stock sheet.
        *   For each `Part` on the board: Create a new group/component for the part, applying its `x`, `y` position and `rotated` state relative to the board's origin.
        *   Apply the part's material to its corresponding geometry.
        *   Consider adding text labels for part names/dimensions on the layout.
        *   Lay out the boards in an organized fashion (e.g., side-by-side) within the SketchUp model.
    *   **User Interaction:** Add a "Visualize Cut List" button to the web dialog that calls this new functionality.

---

#### **5. Unit System Consistency and User Preference**

Ensure consistent unit handling and allow users to choose display units.

*   **File(s) Affected:** `util.rb`, `part.txt`, `board.txt`, `model_analyzer.txt`, `config.rb`, `main_dialog.html`/`main_dialog.js`
*   **Task:**
    1.  **Standardize Internal Units:** Ensure all internal calculations in Ruby primarily use inches (SketchUp's internal unit) and convert to/from millimeters (or other user units) only at the I/O boundaries (UI display, user input).
    2.  **User Preference in `Config`:** Add a setting (e.g., `display_units: 'mm'` or `'in'`) that the user can configure.
    3.  **UI Conversion:** All dimensions displayed in the web dialog or any report should respect this `display_units` setting.
*   **Details:** Currently, there's a mix of `* 25.4` (mm to inches) and division implicitly in the code. A clear standard will prevent future unit-related bugs.

---

#### **6. Parameterize `find_best_position` Step Size**

Make the fixed `step(10)` in `find_best_position` configurable.

*   **File(s) Affected:** `config.rb`, `board.txt`, `main_dialog.html`/`main_dialog.js`
*   **Task:**
    1.  Add a `nesting_step_size` setting to `Config` (default to 10mm).
    2.  Retrieve this setting in `Nester` and pass it to `Board#find_best_position`.
    3.  Replace the hardcoded `step(10)` with the configured value.
*   **Details:** This allows users to trade off performance for precision, especially if they are not using an advanced nesting algorithm yet.

---

**General Recommendations:**

*   **Error Handling:** Improve specific error messages, especially if parts are too large to fit on *any* stock board.
*   **Code Comments:** Add detailed comments for complex logic, especially for the new nesting algorithm.
*   **Testing:** Implement isolated unit tests for the `Board` and `Nester` classes, particularly for the new nesting algorithm, to ensure correctness.

By implementing these improvements, the PARAMETRIX extension will become significantly more intelligent, user-friendly, and powerful for generating optimized cutting lists.