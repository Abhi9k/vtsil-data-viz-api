from db import get_db, execute_one


def get_sensor_metadata(daq_id):
    if int(daq_id) < 1 or int(daq_id) > 197:
        return {"error": "invalid id"}
    row = execute_one(
        """ SELECT daq,bias_level,floor_number,orientation,sensitivity,
				serial,x,y,z from sensor_metadata where id=%s""", (daq_id, ))[0]
    resp = {
        "daq_name": row[0],
        "bias_level": row[1],
        "floor_number": row[2],
        "orientation": row[3],
        "sensitivity": row[4],
        "serial number": row[5],
        "x": row[6],
        "y": row[7],
        "z": row[8]
    }
    return resp
