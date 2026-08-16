from backend.algorithms.sorting import insertion_sort


def check_insertion_sort():
    records = [
        {"id": 1, "priority_rank": 3},
        {"id": 2, "priority_rank": 1},
        {"id": 3, "priority_rank": 2},
        {"id": 4, "priority_rank": 3},
        {"id": 5, "priority_rank": 1},
    ]

    expected = [
        {"id": 2, "priority_rank": 1},
        {"id": 5, "priority_rank": 1},
        {"id": 3, "priority_rank": 2},
        {"id": 1, "priority_rank": 3},
        {"id": 4, "priority_rank": 3},
    ]

    try:
        # Keep reference to the original list to verify
        # that insertion_sort mutates it in place.
        original_list = records

        result = insertion_sort(
            records,
            "priority_rank",
        )

        # Function should not need to return the list.
        if result is not None:
            print(
                "FAIL: insertion_sort should not return a value"
            )
            return False

        # Verify that the original list was modified.
        if records is not original_list:
            print(
                "FAIL: insertion_sort did not operate in place"
            )
            return False

        # Verify the sorted result.
        if records == expected:
            print("PASS: insertion_sort")
        else:
            print(f"FAIL: insertion_sort — expected {expected}, got {records}")
            return False

        

        return True

    except Exception as exc:
        # The script must complete normally even if the
        # algorithm raises an unexpected exception.
        print(
            f"FAIL: insertion_sort raised an unexpected "
            f"exception: {exc}"
        )

        return False


if __name__ == "__main__":
    check_insertion_sort()