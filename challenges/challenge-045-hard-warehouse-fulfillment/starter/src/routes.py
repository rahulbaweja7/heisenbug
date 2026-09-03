from src.fulfillment_service import fulfill_order, FulfillmentDeniedError


def handle_fulfillment_request(order_id, warehouse_id, repository):
    try:
        fulfill_order(order_id, warehouse_id, repository)
        return {"status": "fulfilled", "order_id": order_id}
    except FulfillmentDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "order or warehouse not found"}
