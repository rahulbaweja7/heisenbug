from src.checkout_service import checkout_book, CheckoutDeniedError


def handle_checkout_request(patron_id, book_id, repository):
    try:
        checkout_book(patron_id, book_id, repository)
        return {"status": "success", "patron_id": patron_id, "book_id": book_id}
    except CheckoutDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "patron or book not found"}
