import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const getSafeRevision = (
  value: unknown
) => {
  const revision =
    Number(value);

  if (
    !Number.isInteger(revision) ||
    revision < 0
  ) {
    return null;
  }

  return revision;
};

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      {
        state: null,
        revision: 0,
      },
      {
        status: 401,
      }
    );
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("app_states")
    .select(
      "state, revision"
    )
    .eq(
      "user_id",
      userId
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    state:
      data?.state ||
      null,

    revision:
      Number(
        data?.revision ||
        0
      ),
  });
}

export async function POST(
  request: Request
) {
  const { userId } =
    auth();

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  let body: {
    state?: unknown;
    expectedRevision?: unknown;
  };

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request body",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body ||
    body.state ===
      undefined
  ) {
    return NextResponse.json(
      {
        error:
          "State is required",
      },
      {
        status: 400,
      }
    );
  }

  const expectedRevision =
    getSafeRevision(
      body.expectedRevision
    );

  if (
    expectedRevision ===
    null
  ) {
    return NextResponse.json(
      {
        error:
          "A valid expectedRevision is required",
      },
      {
        status: 400,
      }
    );
  }

  const nextRevision =
    expectedRevision + 1;

  /*
   * Update only when the stored revision still matches
   * the revision this browser last loaded.
   *
   * If another device already saved, this update affects
   * no row and the request is rejected as a conflict.
   */
  const {
    data:
      updatedState,
    error:
      updateError,
  } = await supabaseAdmin
    .from(
      "app_states"
    )
    .update({
      state:
        body.state,

      revision:
        nextRevision,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "user_id",
      userId
    )
    .eq(
      "revision",
      expectedRevision
    )
    .select(
      "revision"
    )
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      {
        error:
          updateError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (updatedState) {
    return NextResponse.json({
      ok: true,

      revision:
        Number(
          updatedState.revision
        ),
    });
  }

  /*
   * A missing row is valid only for a user's first save.
   *
   * The first revision must start at 1.
   */
  if (
    expectedRevision ===
    0
  ) {
    const {
      data:
        insertedState,
      error:
        insertError,
    } = await supabaseAdmin
      .from(
        "app_states"
      )
      .insert({
        user_id:
          userId,

        state:
          body.state,

        revision:
          1,

        updated_at:
          new Date()
            .toISOString(),
      })
      .select(
        "revision"
      )
      .single();

    if (!insertError) {
      return NextResponse.json({
        ok: true,

        revision:
          Number(
            insertedState.revision
          ),
      });
    }

    /*
     * A row may have been created by another device
     * between the update and insert attempts.
     *
     * Treat duplicate-row races as revision conflicts.
     */
    if (
      insertError.code ===
      "23505"
    ) {
      return NextResponse.json(
        {
          error:
            "State revision conflict",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          insertError.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      error:
        "State revision conflict",
    },
    {
      status: 409,
    }
  );
}